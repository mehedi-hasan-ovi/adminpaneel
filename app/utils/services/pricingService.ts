import { SubscriptionFeatureDto } from "~/application/dtos/subscriptions/SubscriptionFeatureDto";
import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";
import { SubscriptionPriceType } from "~/application/enums/subscriptions/SubscriptionPriceType";
import { SubscriptionProductDto } from "../../application/dtos/subscriptions/SubscriptionProductDto";
import {
  createSubscriptionProduct,
  createSubscriptionPrice,
  createSubscriptionFeature,
  updateSubscriptionProductStripeId,
  updateSubscriptionPriceStripeId,
  deleteSubscriptionPrice,
  deleteSubscriptionProduct,
  updateSubscriptionProduct,
  deleteSubscriptionFeatures,
  deleteSubscriptionUsageBasedTier,
  deleteSubscriptionUsageBasedPrice,
  createSubscriptionUsageBasedPrice,
  createSubscriptionUsageBasedTier,
  getSubscriptionPriceByStripeId,
  getSubscriptionUsageBasedPriceByStripeId,
  getSubscriptionProduct,
} from "../db/subscriptionProducts.db.server";
import {
  createStripeProduct,
  createStripePrice,
  archiveStripePrice,
  deleteStripeProduct,
  updateStripeProduct,
  createStripeUsageBasedPrice,
  archiveStripeProduct,
  getStripeSession,
  createStripeCustomer,
} from "../stripe.server";
import { CheckoutSessionStatus, SubscriptionPrice, SubscriptionUsageBasedPrice } from "@prisma/client";
import Stripe from "stripe";
import { getOrPersistTenantSubscription, updateTenantSubscriptionCustomerId } from "../db/tenantSubscriptions.db.server";
import { createSubscriptionSubscribedEvent } from "./events/subscriptionsEventsService";
import { getTenant } from "../db/tenants.db.server";
import { getCheckoutSessionStatus, updateCheckoutSessionStatus } from "../db/stripe/checkoutSessions.db.server";
import { SubscriptionUsageBasedPriceDto } from "~/application/dtos/subscriptions/SubscriptionUsageBasedPriceDto";
import { TFunction } from "react-i18next";
import { TenantTypesApi } from "../api/TenantTypesApi";
import {
  getTenantSubscriptionProduct,
  addTenantSubscriptionProduct,
  updateTenantSubscriptionProduct,
} from "../db/subscriptions/tenantSubscriptionProducts.db.server";

export async function createPlans(plans: SubscriptionProductDto[]) {
  return await Promise.all(
    plans
      .sort((a, b) => a.order - b.order)
      .map(async (plan) => {
        await createPlan(
          plan,
          plan.prices.map((price) => {
            return {
              billingPeriod: price.billingPeriod,
              currency: price.currency,
              price: Number(price.price),
            };
          }),
          plan.features,
          plan.usageBasedPrices
        );
      })
  );
}

export async function createPlan(
  plan: SubscriptionProductDto,
  prices: { billingPeriod: SubscriptionBillingPeriod; price: number; currency: string; trialDays?: number }[],
  features: SubscriptionFeatureDto[],
  usageBasedPrices: SubscriptionUsageBasedPriceDto[],
  t?: TFunction
) {
  // Create stripe product
  const stripeProduct = await createStripeProduct({ title: plan.translatedTitle ?? plan.title });
  // Save to db
  const product = await createSubscriptionProduct({
    stripeId: stripeProduct?.id ?? "",
    order: plan.order,
    title: plan.title,
    model: plan.model,
    description: plan.description ?? undefined,
    badge: plan.badge ?? undefined,
    groupTitle: plan.groupTitle ?? undefined,
    groupDescription: plan.groupDescription ?? undefined,
    active: plan.active,
    public: plan.public,
  });

  if (!product) {
    throw new Error("Could not create subscription product");
  }

  await Promise.all(
    prices.map(async (price) => {
      // Create stripe price
      const stripePrice = await createStripePrice(stripeProduct?.id ?? "", price);
      // Save to db
      return await createSubscriptionPrice({
        ...price,
        subscriptionProductId: product.id,
        stripeId: stripePrice?.id ?? "",
        type: SubscriptionPriceType.RECURRING,
        billingPeriod: price.billingPeriod,
        price: price.price,
        currency: price.currency,
        trialDays: price.trialDays ?? 0,
        active: true,
      });
    })
  );

  await Promise.all(
    features
      .sort((a, b) => a.order - b.order)
      .map(async (feature) => {
        // Save to db
        return await createSubscriptionFeature(product.id, feature);
      })
  );

  await Promise.all(
    usageBasedPrices.map(async (usageBasedPrice) => {
      // eslint-disable-next-line no-console
      console.log("CREATING USAGE BASED PRICE", usageBasedPrice);
      const stripePrice = await createStripeUsageBasedPrice(stripeProduct?.id ?? "", {
        ...usageBasedPrice,
        unitTitle: t ? t(usageBasedPrice.unitTitle) : usageBasedPrice.unitTitle,
      });
      const createdPrice = await createSubscriptionUsageBasedPrice({
        subscriptionProductId: product.id,
        stripeId: stripePrice?.id ?? "",
        billingPeriod: usageBasedPrice.billingPeriod,
        currency: usageBasedPrice.currency,
        unit: usageBasedPrice.unit,
        unitTitle: usageBasedPrice.unitTitle,
        unitTitlePlural: usageBasedPrice.unitTitlePlural,
        usageType: usageBasedPrice.usageType,
        aggregateUsage: usageBasedPrice.aggregateUsage,
        tiersMode: usageBasedPrice.tiersMode,
        billingScheme: usageBasedPrice.billingScheme,
      });
      await Promise.all(
        usageBasedPrice.tiers.map(async (tierPrice) => {
          await createSubscriptionUsageBasedTier({
            subscriptionUsageBasedPriceId: createdPrice.id,
            from: tierPrice.from,
            to: tierPrice.to !== null && tierPrice.to !== undefined ? Number(tierPrice.to) : undefined,
            perUnitPrice: tierPrice.perUnitPrice !== null && tierPrice.perUnitPrice !== undefined ? Number(tierPrice.perUnitPrice) : undefined,
            flatFeePrice: tierPrice.flatFeePrice !== null && tierPrice.flatFeePrice !== undefined ? Number(tierPrice.flatFeePrice) : undefined,
          });
        })
      );
    })
  );
}

export async function syncPlan(
  plan: SubscriptionProductDto,
  prices: { id?: string; billingPeriod: SubscriptionBillingPeriod; price: number; currency: string }[]
) {
  if (!plan.id) {
    throw new Error(`Plan ${plan.title} not found on database`);
  }
  const stripeProduct = await createStripeProduct({ title: plan.translatedTitle ?? plan.title });
  if (!stripeProduct) {
    throw new Error("Could not create product");
  }
  await updateSubscriptionProductStripeId(plan.id, {
    stripeId: stripeProduct.id,
  });

  prices.map(async (price) => {
    // Create stripe price
    const stripePrice = await createStripePrice(stripeProduct?.id ?? "", price);
    if (!stripePrice) {
      throw new Error(`Could not create price ${plan.title} - ${price.price}`);
    }
    // Save to db
    await updateSubscriptionPriceStripeId(price.id ?? "", {
      stripeId: stripePrice?.id ?? "",
    });
  });
}

export async function updatePlan(plan: SubscriptionProductDto, features: SubscriptionFeatureDto[]) {
  if (!plan.id) {
    throw new Error(`Plan ${plan.title} not found on database`);
  }

  await updateStripeProduct(plan.stripeId, { title: plan.translatedTitle ?? plan.title });

  await updateSubscriptionProduct(plan.id, {
    order: plan.order,
    title: plan.title,
    model: plan.model,
    description: plan.description ?? undefined,
    badge: plan.badge ?? undefined,
    groupTitle: plan.groupTitle ?? undefined,
    groupDescription: plan.groupDescription ?? undefined,
    public: plan.public,
  });

  await deleteSubscriptionFeatures(plan.id ?? "");

  return await Promise.all(
    features
      .sort((a, b) => a.order - b.order)
      .map(async (feature) => {
        return await createSubscriptionFeature(plan.id ?? "", feature);
      })
  );
}

export async function deletePlan(plan: SubscriptionProductDto) {
  // eslint-disable-next-line no-console
  console.log(`Deleting ${plan.prices?.length} Flat-rate Prices`);

  await Promise.all(
    plan.prices
      .filter((f) => f.stripeId)
      .map(async (price) => {
        await archiveStripePrice(price.stripeId);

        if (price.id) {
          await deleteSubscriptionPrice(price.id);
        }

        return null;
      })
  );

  // eslint-disable-next-line no-console
  console.log(`Deleting ${plan.usageBasedPrices?.length ?? 0} Usage-based Prices`);
  if (plan.usageBasedPrices) {
    await Promise.all(
      plan.usageBasedPrices?.map(async (price) => {
        await archiveStripePrice(price.stripeId);

        await Promise.all(
          price.tiers.map(async (tier) => {
            return deleteSubscriptionUsageBasedTier(tier.id);
          })
        );
        await deleteSubscriptionUsageBasedPrice(price.id);

        return null;
      })
    );
  }

  // eslint-disable-next-line no-console
  console.log("Deleting Product with Stripe ID: " + plan.stripeId);
  if (plan.stripeId) {
    try {
      await deleteStripeProduct(plan.stripeId);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      await archiveStripeProduct(plan.stripeId);
    }
  }

  if (plan.id) {
    await deleteSubscriptionProduct(plan.id);
  }
}

export type CheckoutSessionResponse = {
  id: string;
  customer: {
    id: string;
    email: string;
    name: string;
  };
  products: {
    id: string;
    title: string;
    quantity: number;
    subscription: string | undefined;
    prices: { flatPrice?: SubscriptionPrice; usageBasedPrice?: SubscriptionUsageBasedPrice; quantity?: number }[];
  }[];
  status: CheckoutSessionStatus | null;
};
export async function getAcquiredItemsFromCheckoutSession(session_id: string | null): Promise<CheckoutSessionResponse | null> {
  const session = await getStripeSession(session_id ?? "");
  if (!session) {
    return null;
  }
  const prices: { flatPrice?: SubscriptionPrice; usageBasedPrice?: SubscriptionUsageBasedPrice; quantity?: number }[] = [];
  try {
    let line_items: { price: Stripe.Price; quantity: number | undefined }[] = [];
    if (session.line_items) {
      session.line_items.data.forEach((item) => {
        if (item.price) {
          line_items.push({
            price: item.price,
            quantity: item.quantity ?? undefined,
          });
        }
      });
    }

    await Promise.all(
      line_items.map(async (line_item) => {
        const flatPrice = await getSubscriptionPriceByStripeId(line_item.price.id);
        const usageBasedPrice = await getSubscriptionUsageBasedPriceByStripeId(line_item.price.id);
        const quantity = line_item.quantity ?? undefined;
        if (!flatPrice && !usageBasedPrice) {
          throw new Error("Price not found: " + line_item.price.id);
        }
        prices.push({
          flatPrice: flatPrice ?? undefined,
          usageBasedPrice: usageBasedPrice ?? undefined,
          quantity,
        });
      })
    );
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error(e.message);
  }

  const products: {
    id: string;
    title: string;
    quantity: number;
    subscription: string | undefined;
    prices: { flatPrice?: SubscriptionPrice; usageBasedPrice?: SubscriptionUsageBasedPrice; quantity?: number }[];
  }[] = [];

  prices.forEach((item) => {
    const productId = item.flatPrice?.subscriptionProductId ?? item.usageBasedPrice?.subscriptionProductId ?? "";
    if (!productId) {
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) {
      products.push({
        id: productId,
        title: "",
        quantity: item.quantity ?? 1,
        prices: [item],
        subscription: session.subscription?.toString(),
      });
    } else {
      product?.prices.push(item);
    }
  });

  await Promise.all(
    products.map(async (product) => {
      const subscriptionProduct = await getSubscriptionProduct(product.id);
      product.title = subscriptionProduct?.title ?? "";
    })
  );

  const status = await getCheckoutSessionStatus(session.id);

  return {
    id: session.id,
    customer: {
      id: session.customer?.toString() ?? "",
      name: session.customer_details?.name ?? "",
      email: session.customer_details?.email ?? "",
    },
    products,
    status,
  };
}

export async function addTenantProductsFromCheckoutSession({
  tenantId,
  user,
  checkoutSession,
  createdUserId,
  createdTenantId,
  t,
}: {
  tenantId: string;
  user: { id: string; email: string };
  checkoutSession: CheckoutSessionResponse;
  createdUserId?: string | null;
  createdTenantId?: string | null;
  t: TFunction;
}) {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  const tenantSubscription = await getOrPersistTenantSubscription(tenant.id);
  if (!tenantSubscription.stripeCustomerId) {
    const customer = await createStripeCustomer(user.email, tenant.name);
    if (customer) {
      tenantSubscription.stripeCustomerId = customer.id;
      await updateTenantSubscriptionCustomerId(tenant.id, {
        stripeCustomerId: customer.id,
      });
    }
  }
  const existingSessionStatus = await getCheckoutSessionStatus(checkoutSession.id);
  if (!checkoutSession) {
    throw new Error(t("settings.subscription.checkout.invalid"));
  } else if (checkoutSession.customer.id !== tenantSubscription.stripeCustomerId) {
    throw new Error(t("settings.subscription.checkout.invalidCustomer"));
  } else if (!existingSessionStatus) {
    throw new Error(t("settings.subscription.checkout.invalid"));
  } else if (!existingSessionStatus.pending) {
    throw new Error(t("settings.subscription.checkout.alreadyProcessed"));
  } else {
    await updateCheckoutSessionStatus(checkoutSession.id, {
      pending: false,
      createdUserId,
      createdTenantId,
    });
    await Promise.all(
      checkoutSession.products.map(async (product) => {
        const existingProduct = await getTenantSubscriptionProduct(tenant.id, product.id);
        if (!existingProduct) {
          await addTenantSubscriptionProduct({
            tenantSubscriptionId: tenantSubscription.id,
            subscriptionProductId: product.id ?? "",
            quantity: product.quantity,
            stripeSubscriptionId: product.subscription ?? "",
            fromCheckoutSessionId: checkoutSession.id,
            prices: product.prices.map((price) => {
              return {
                subscriptionPriceId: price.flatPrice?.id,
                subscriptionUsageBasedPriceId: price.usageBasedPrice?.id,
              };
            }),
          });
        } else {
          // is active
          if (!existingProduct.endsAt) {
            await updateTenantSubscriptionProduct(existingProduct.id, {
              quantity: (existingProduct.quantity ?? 1) + 1,
            });
          } else {
            await updateTenantSubscriptionProduct(existingProduct.id, {
              quantity: product.quantity,
              endsAt: null,
              cancelledAt: null,
            });
          }
        }
        const subscriptionProduct = await getSubscriptionProduct(product.id);
        if (subscriptionProduct) {
          await createSubscriptionSubscribedEvent(tenant.id, {
            user: { id: user.id, email: user.email },
            subscription: {
              product: { id: product.id, title: t(subscriptionProduct.title) },
              session: checkoutSession.id,
            },
          });

          await TenantTypesApi.setTenantTypes({ tenantId, subscriptionProduct });
        }
      })
    );
  }
}
