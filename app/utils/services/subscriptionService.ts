import { Prisma, SubscriptionPrice } from "@prisma/client";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { SubscriptionFeatureDto } from "~/application/dtos/subscriptions/SubscriptionFeatureDto";
import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";
import { SubscriptionFeatureLimitType } from "~/application/enums/subscriptions/SubscriptionFeatureLimitType";
import currencies from "~/application/pricing/currencies";
import { db } from "../db.server";
import { findEntityByName } from "../db/entities/entities.db.server";
import { createCheckoutSessionStatus, getCheckoutSessionStatus } from "../db/stripe/checkoutSessions.db.server";
import { getAllSubscriptionFeatures } from "../db/subscriptionProducts.db.server";
import { TenantSubscriptionWithDetails, getTenantSubscription, getTenantSubscriptions } from "../db/tenantSubscriptions.db.server";
import { sendEmail } from "../email.server";
import { apiKeyCreditableStatusCodes, apiKeyIgnoreEndpoints } from "../helpers/ApiKeyHelper";
import { createUsageRecord, getStripeSession, getStripeSubscription } from "../stripe.server";
import { baseURL } from "../url.server";
import { getAcquiredItemsFromCheckoutSession } from "./pricingService";

export async function getPlanFeaturesUsage(tenantId: string): Promise<PlanFeatureUsageDto[]> {
  const subscription = await getActiveTenantSubscriptions(tenantId);

  const myUsage: PlanFeatureUsageDto[] = [];
  let allFeatures: SubscriptionFeatureDto[] = [];
  const features = await getAllSubscriptionFeatures();
  features
    .filter((f) => f.name)
    .forEach((feature) => {
      const existing = allFeatures.find((f) => f.name === feature.name);
      if (!existing) {
        allFeatures.push({
          order: feature.order,
          name: feature.name,
          title: feature.title,
          type: feature.type,
          value: feature.value,
        });
      }
    });
  allFeatures = allFeatures.sort((a, b) => a.order - b.order);

  await Promise.all(
    allFeatures.map(async (item) => {
      let myFeatures: SubscriptionFeatureDto[] = [];
      subscription?.products.forEach((product) => {
        const feature = product.subscriptionProduct.features.find((f) => f.name === item.name);
        if (feature) {
          if (!product.quantity) {
            myFeatures.push(feature);
          } else {
            // per-seat or one-time multiplication
            for (let idx = 0; idx < product.quantity; idx++) {
              myFeatures.push(feature);
            }
          }
        }
      });
      const existingSubscriptionFeature = mergeFeatures(myFeatures);
      const feature = existingSubscriptionFeature ?? item;
      const entity = await findEntityByName({ tenantId, name: item.name });
      const usage: PlanFeatureUsageDto = {
        entity: entity ?? undefined,
        order: feature.order,
        title: feature.title,
        name: feature.name,
        type: feature.type,
        value: feature.value,
        used: 0,
        remaining: 0,
        enabled: feature.type !== SubscriptionFeatureLimitType.NOT_INCLUDED,
        message: "",
      };

      if (!existingSubscriptionFeature) {
        usage.type = SubscriptionFeatureLimitType.NOT_INCLUDED;
        usage.enabled = false;
        usage.message = "featureLimits.noSubscription";
      } else {
        if (feature.type === SubscriptionFeatureLimitType.NOT_INCLUDED) {
          usage.enabled = false;
          usage.message = "featureLimits.notIncluded";
        } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
          usage.used = await getUsed(tenantId, feature, subscription);
          usage.remaining = usage.value - usage.used;
          if (usage.remaining <= 0) {
            usage.message = `You've reached the limit (${usage.used}/${usage.value}) for ${entity?.titlePlural ?? feature.name}`;
            usage.enabled = false;
          }
        } else if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
          usage.used = await getUsed(tenantId, feature, subscription);
          usage.remaining = usage.value - usage.used;
          usage.period = getUsedPeriod(subscription);
          if (usage.remaining <= 0) {
            // var now = new Date();
            // const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            usage.message = `You've reached the limit this month (${usage.used}/${usage.value}) for ${entity?.titlePlural ?? feature.name}`;
            usage.enabled = false;
          }
        } else if (feature.type === SubscriptionFeatureLimitType.UNLIMITED) {
          usage.remaining = "unlimited";
        }
      }
      myUsage.push(usage);
    })
  );

  return myUsage.sort((a, b) => a.order - b.order);
}

function mergeFeatures(features: SubscriptionFeatureDto[]) {
  if (features.length === 0) {
    return undefined;
  }
  const mergedFeature: SubscriptionFeatureDto = {
    order: features[0].order,
    title: features[0].title,
    name: features[0].name,
    type: SubscriptionFeatureLimitType.NOT_INCLUDED,
    value: 0,
  };

  features.forEach((feature) => {
    if (mergedFeature.type < feature.type) {
      mergedFeature.type = feature.type;
    }
    mergedFeature.value += feature.value;
  });

  return mergedFeature;
}

export async function getPlanFeatureUsage(tenantId: string, featureName: string): Promise<PlanFeatureUsageDto | undefined> {
  const usage = await getPlanFeaturesUsage(tenantId);
  return usage.find((f) => f.name === featureName);
}

function getUsedPeriod(subscription: TenantSubscriptionWithDetails | null) {
  const date = new Date(),
    y = date.getFullYear(),
    m = date.getMonth();
  let firstDay = new Date(y, m, 1, 0, 0, 1);
  let lastDay = new Date(y, m + 1, 0, 23, 59, 59);

  subscription?.products.forEach((product) => {
    if (product.currentPeriodStart && product.currentPeriodEnd) {
      firstDay = product.currentPeriodStart;
      lastDay = product.currentPeriodEnd;
    }
  });

  return {
    firstDay,
    lastDay,
  };
}

async function getUsed(tenantId: string, feature: SubscriptionFeatureDto, subscription: TenantSubscriptionWithDetails | null): Promise<number> {
  const { firstDay, lastDay } = await getUsedPeriod(subscription);
  if (feature.name === DefaultFeatures.Users) {
    if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
      return await db.tenantUser.count({
        where: {
          tenantId,
          createdAt: {
            gte: firstDay,
            lt: lastDay,
          },
        },
      });
    } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
      return await db.tenantUser.count({
        where: {
          tenantId,
        },
      });
    }
  } else if (feature.name === DefaultFeatures.API) {
    if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
      return await db.apiKeyLog.count({
        where: {
          apiKey: {
            tenantId,
          },
          status: { in: apiKeyCreditableStatusCodes },
          endpoint: { notIn: apiKeyIgnoreEndpoints },
          createdAt: {
            gte: firstDay,
            lt: lastDay,
          },
        },
      });
    } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
      return await db.apiKeyLog.count({
        where: {
          apiKey: {
            tenantId,
          },
          status: { in: apiKeyCreditableStatusCodes },
        },
      });
    }
  } else if (feature.name === DefaultFeatures.BlogPosts) {
    if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
      return await db.blogPost.count({
        where: {
          tenantId,
          createdAt: {
            gte: firstDay,
            lt: lastDay,
          },
        },
      });
    } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
      return await db.blogPost.count({
        where: {
          tenantId,
        },
      });
    }
  } else if (feature.name === DefaultFeatures.LinkedAccounts) {
    if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
      return await db.linkedAccount.count({
        where: {
          OR: [{ clientTenantId: tenantId }, { providerTenantId: tenantId }],
          createdAt: {
            gte: firstDay,
            lt: lastDay,
          },
        },
      });
    } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
      return await db.linkedAccount.count({
        where: {
          OR: [{ clientTenantId: tenantId }, { providerTenantId: tenantId }],
        },
      });
    }
  } else {
    const entity = await findEntityByName({ tenantId, name: feature.name });
    // if (!entity) {
    //   // throw new Error("Entity does not exist with plural title: " + feature.name);
    // }
    if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
      const where: Prisma.RowWhereInput = {
        tenantId,
        entityId: entity?.id ?? "",
        createdAt: {
          gte: firstDay,
          lt: lastDay,
        },
      };
      return db.row.count({
        where,
      });
    } else if (feature.type === SubscriptionFeatureLimitType.MAX) {
      const count = await db.row.count({
        where: {
          tenantId,
          entityId: entity?.id ?? "",
        },
      });
      return count;
    }
  }
  return 0;
}

// export async function getPlanFeatureUsage(tenantId: string, featureName: string): Promise<PlanFeatureUsageDto> {
//   const myUsage: PlanFeatureUsageDto[] = [];
//   let allFeatures: SubscriptionFeatureDto[] = [];
//   const features = await getAllSubscriptionFeatures();
//   features.forEach((feature) => {
//     const existing = allFeatures.find((f) => f.name === feature.name);
//     if (!existing) {
//       allFeatures.push({
//         order: feature.order,
//         name: feature.name,
//         title: feature.title,
//         type: feature.type,
//         value: feature.value,
//       });
//     }
//   });
//   allFeatures = allFeatures.sort((a, b) => a.order - b.order);

//   allFeatures.forEach((feature) => {
//     const featureUsage: PlanFeatureUsageDto = {
//       order: feature.order,
//       title: feature.title,
//       name: feature.name,
//       type: feature.type,
//       value: feature.value,
//       used: 0,
//       remaining: 0,
//     };
//     if (feature.type === SubscriptionFeatureLimitType.MAX) {
//       featureUsage.used = 2;
//       featureUsage.remaining = featureUsage.value - featureUsage.used;
//     } else if (feature.type === SubscriptionFeatureLimitType.MONTHLY) {
//       featureUsage.used = 3;
//       featureUsage.remaining = featureUsage.value - featureUsage.used;
//     }
//     myUsage.push(featureUsage);
//   });

//   return myUsage;
// }

export async function getActiveTenantSubscriptions(tenantId: string) {
  const mySubscription = await getTenantSubscription(tenantId);
  if (mySubscription) {
    await Promise.all(
      mySubscription.products.map(async (item) => {
        if (item.stripeSubscriptionId) {
          let currentPeriod = item.currentPeriodStart && item.currentPeriodEnd ? { start: item.currentPeriodStart, end: item.currentPeriodEnd } : undefined;
          const today = new Date();
          let todayIsInCurrentPeriod = false;
          if (currentPeriod) {
            todayIsInCurrentPeriod = today >= item.currentPeriodStart! && today <= item.currentPeriodEnd!;
          }
          if (currentPeriod && todayIsInCurrentPeriod) {
            item.currentPeriodStart = currentPeriod.start;
            item.currentPeriodEnd = currentPeriod.end;
          } else {
            const stripeSubscription = await getStripeSubscription(item.stripeSubscriptionId);
            if (stripeSubscription) {
              item.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
              item.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            }
            await db.tenantSubscriptionProduct.update({
              where: { id: item.id },
              data: {
                currentPeriodStart: item.currentPeriodStart,
                currentPeriodEnd: item.currentPeriodEnd,
              },
            });
          }
        }
      })
    );
    mySubscription.products = mySubscription.products.filter((f) => !f.endsAt || new Date(f.endsAt) > new Date());
  }
  return mySubscription;
}

export async function getActiveTenantsSubscriptions() {
  const subscriptions = await getTenantSubscriptions();
  return await Promise.all(
    subscriptions.map(async (mySubscription) => {
      await Promise.all(
        mySubscription.products.map(async (item) => {
          if (item.stripeSubscriptionId) {
            const stripeSubscription = await getStripeSubscription(item.stripeSubscriptionId);
            if (stripeSubscription) {
              item.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
              item.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            }
          }
        })
      );
      mySubscription.products = mySubscription.products.filter((f) => !f.endsAt || new Date(f.endsAt) > new Date());
      return mySubscription;
    })
  );
}

export async function reportUsage(tenantId: string, unit: string) {
  const tenantSubscription = await getActiveTenantSubscriptions(tenantId);
  if (!tenantSubscription) {
    return;
  }
  await Promise.all(
    tenantSubscription.products.map(async (product) => {
      return await Promise.all(
        product.prices.map(async (price) => {
          if (!product.stripeSubscriptionId) {
            return;
          }
          if (price.subscriptionUsageBasedPrice?.unit === unit) {
            const stripeSubscription = await getStripeSubscription(product.stripeSubscriptionId);
            const subscriptionItem = stripeSubscription?.items.data.find((f) => f.price.id === price.subscriptionUsageBasedPrice?.stripeId);
            if (subscriptionItem) {
              // console.log("[REPORT USAGE] Will report usage for subscription item id", subscriptionItem);
              const usageRecord = await createUsageRecord(subscriptionItem.id, 1, "increment");
              if (usageRecord) {
                await db.tenantSubscriptionUsageRecord.create({
                  data: {
                    tenantSubscriptionProductPriceId: price.id,
                    timestamp: usageRecord.timestamp,
                    quantity: usageRecord.quantity,
                    stripeSubscriptionItemId: subscriptionItem.id,
                  },
                });
              }
            }
          }
        })
      );
    })
  );
}

export async function persistCheckoutSessionStatus({
  id,
  fromUrl,
  fromUserId,
  fromTenantId,
}: {
  id: string;
  fromUrl: string;
  fromUserId?: string | null;
  fromTenantId?: string | null;
}) {
  const existingCheckoutSession = await getCheckoutSessionStatus(id);
  if (!existingCheckoutSession) {
    const stripeCheckoutSession = await getStripeSession(id);
    if (stripeCheckoutSession) {
      const session = await createCheckoutSessionStatus({
        id: stripeCheckoutSession.id,
        email: stripeCheckoutSession.customer_details?.email ?? "",
        fromUrl,
        fromUserId,
        fromTenantId,
      });
      if (!session.fromUserId && !session.fromTenantId) {
        const sessionResponse = await getAcquiredItemsFromCheckoutSession(session.id);
        if (sessionResponse && sessionResponse.products.length > 0) {
          await sendEmail(session.email, "account-setup", {
            email: session.email,
            plan: sessionResponse.products[0].title,
            action_url: `${baseURL}/pricing/${session.id}/success`,
          });
        }
      }
    }
  }
}

export async function getMrr(currency: string) {
  const activeSubscriptions = await getActiveTenantsSubscriptions();
  let summary: { total: number; count: number } = {
    total: 0,
    count: 0,
  };
  activeSubscriptions.forEach((s) => {
    s.products.forEach((p) => {
      summary.count++;
      p.prices.forEach((f) => {
        summary.total += getPriceInCurrency(f.subscriptionPrice, currency);
      });
    });
  });
  return summary;
}

function getPriceInCurrency(subscriptionPrice: SubscriptionPrice | null, currency: string) {
  if (!subscriptionPrice) {
    return 0;
  }
  let total = 0;
  if (subscriptionPrice.billingPeriod === SubscriptionBillingPeriod.MONTHLY) {
    total = Number(subscriptionPrice.price);
  } else if (subscriptionPrice.billingPeriod === SubscriptionBillingPeriod.YEARLY) {
    total = Number(subscriptionPrice.price) / 12;
  } else if (subscriptionPrice.billingPeriod === SubscriptionBillingPeriod.WEEKLY) {
    total = Number(subscriptionPrice.price) * 4;
  } else if (subscriptionPrice.billingPeriod === SubscriptionBillingPeriod.DAILY) {
    total = Number(subscriptionPrice.price) * 30;
  }
  if (currency !== subscriptionPrice.currency) {
    total = convertToCurrency({ from: subscriptionPrice.currency, to: currency, price: total });
  }
  return total;
}

function convertToCurrency({ from, price, to }: { from: string; price: number; to: string }): number {
  const fromCurrency = currencies.find((f) => f.value === from);
  const toCurrency = currencies.find((f) => f.value === to);
  if (!fromCurrency || !toCurrency) {
    return 0;
  }
  const fromParity = fromCurrency.parities?.find((f) => f.from === to);
  const toParity = toCurrency.parities?.find((f) => f.from === from);
  if (fromParity && fromParity.parity !== 0) {
    return price / fromParity.parity;
  } else if (toParity && toParity.parity !== 0) {
    return price / toParity.parity;
  }
  return 0;
}
