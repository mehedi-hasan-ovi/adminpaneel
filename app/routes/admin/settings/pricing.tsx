import { useTranslation } from "react-i18next";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import { useEffect, useRef, useState } from "react";
import plans from "~/application/pricing/plans.server";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, Outlet, useSubmit, useNavigation } from "@remix-run/react";
import { getAllSubscriptionProducts, getAllSubscriptionProductsWithTenants, getSubscriptionProduct } from "~/utils/db/subscriptionProducts.db.server";
import SuccessModal, { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import { createPlans, syncPlan } from "~/utils/services/pricingService";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import { createAdminLog } from "~/utils/db/logs.db.server";
import { PricingModel } from "~/application/enums/subscriptions/PricingModel";
import { SubscriptionFeatureDto } from "~/application/dtos/subscriptions/SubscriptionFeatureDto";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { useAdminData } from "~/utils/data/useAdminData";
import InputSelect from "~/components/ui/input/InputSelect";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import TableSimple from "~/components/ui/tables/TableSimple";
import SimpleBadge from "~/components/ui/badges/SimpleBadge";
import { Colors } from "~/application/enums/shared/Colors";
import ButtonTertiary from "~/components/ui/buttons/ButtonTertiary";
import { useTypedActionData, useTypedLoaderData } from "remix-typedjson";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  isStripeTest: boolean;
  items: SubscriptionProductDto[];
};

export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.pricing.view");
  let { t } = await i18nHelper(request);
  const data: LoaderData = {
    title: `${t("admin.pricing.title")} | ${process.env.APP_NAME}`,
    isStripeTest: process.env.STRIPE_SK?.toString().startsWith("sk_test_") ?? true,
    items: await getAllSubscriptionProductsWithTenants(),
  };

  if (data.items.length === 0) {
    data.items = plans;
  }

  return json(data);
};

export type PricingPlansActionData = {
  error?: string;
  success?: string;
  items?: Awaited<ReturnType<typeof getAllSubscriptionProducts>>;
};
const badRequest = (data: PricingPlansActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);

  const form = await request.formData();
  const action = form.get("action")?.toString();
  if (action === "create-all-plans") {
    const model = Number(form.get("model")) as PricingModel;
    const items = await getAllSubscriptionProducts();
    if (items.length > 0) {
      return json({
        items,
      });
    }

    await Promise.all(
      plans
        .filter((f) => f.model === model || model === PricingModel.ALL)
        .map(async (plan) => {
          plan.translatedTitle = t(plan.title);
          plan.usageBasedPrices.forEach((usageBasedPrice) => {
            usageBasedPrice.unitTitle = t(usageBasedPrice.unitTitle);
            usageBasedPrice.unitTitlePlural = t(usageBasedPrice.unitTitlePlural);
          });
        })
    );

    try {
      await createPlans(plans.filter((f) => f.model === model || model === PricingModel.ALL));
      await createAdminLog(request, "Created pricing plans", plans.map((f) => t(f.title)).join(", "));

      await new Promise((r) => setTimeout(r, 3000));

      return json({
        items: await getAllSubscriptionProducts(),
      });
    } catch (e: any) {
      return badRequest({ error: e?.toString() });
    }
  } else if (action === "sync-plan-with-payment-provider") {
    const id = form.get("id")?.toString() ?? "";
    const item = await getSubscriptionProduct(id);
    if (!item) {
      return badRequest({ error: "Pricing plan not found" });
    }
    try {
      item.translatedTitle = t(item.title);
      await syncPlan(
        item,
        item.prices.map((price) => {
          return {
            id: price.id,
            billingPeriod: price.billingPeriod,
            currency: price.currency,
            price: Number(price.price),
          };
        })
      );
      return json({
        items: await getAllSubscriptionProducts(),
      });
    } catch (error: any) {
      return badRequest({ error: error.message });
    }
  }
};

export default function AdminPricingRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedActionData<PricingPlansActionData>();
  const adminData = useAdminData();
  const { t } = useTranslation();
  const submit = useSubmit();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";

  const errorModal = useRef<RefErrorModal>(null);
  const successModal = useRef<RefSuccessModal>(null);

  const [model, setModel] = useState<PricingModel>(PricingModel.FLAT_RATE);
  const [items, setItems] = useState<SubscriptionProductDto[]>([]);
  const [, setAllFeatures] = useState<SubscriptionFeatureDto[]>([]);

  useEffect(() => {
    updateItems(data.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.items, model]);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData.error);
    }
    if (actionData?.success) {
      successModal.current?.show(t("shared.success"), actionData.success);
    }
    updateItems(actionData?.items ?? data.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  function updateItems(items: SubscriptionProductDto[]) {
    if (items.filter((f) => f.id).length > 0) {
      setItems(items);
    } else {
      setItems(items.filter((f) => f.model === model || model === PricingModel.ALL));
    }
  }

  useEffect(() => {
    const allFeatures: SubscriptionFeatureDto[] = [];
    items.forEach((item) => {
      item.features.forEach((feature) => {
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
    });
    setAllFeatures(allFeatures.sort((a, b) => a.order - b.order));
  }, [items]);

  const sortedItems = () => {
    return items.sort((x, y) => {
      return x?.order > y?.order ? 1 : -1;
    });
  };

  function createAllPlans() {
    const form = new FormData();
    form.set("action", "create-all-plans");
    form.set("model", model.toString());
    submit(form, {
      method: "post",
    });
  }
  // function syncPlanWithPaymentProvider(item: SubscriptionProductDto) {
  //   const form = new FormData();
  //   form.set("action", "sync-plan-with-payment-provider");
  //   form.set("id", item.id?.toString() ?? "");
  //   submit(form, {
  //     method: "post",
  //   });
  // }
  // function createPlan(item: SubscriptionProductDto) {
  //   const form = new FormData();
  //   form.set("action", "create");
  //   form.set("order", item.order);
  //   form.set("order", item.description);
  //   employees.forEach((item) => {
  //     form.append("employees[]", JSON.stringify(item));
  //   });
  //   submit(form, {
  //     method: "post",
  //   });
  // }

  function createdPlans() {
    return data.items.filter((f) => f.id).length;
  }

  // function getFeatureValue(item: SubscriptionProductDto, name: string) {
  //   return item.features.find((f) => f.name === name);
  // }

  return (
    <div className="flex-1 overflow-x-auto xl:overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex justify-between space-x-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("admin.pricing.title")}</h1>
          <Form method="post" className="flex h-9 items-center space-x-2">
            <ButtonSecondary disabled={loading} to="/pricing" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div>{t("shared.preview")}</div>
            </ButtonSecondary>
            {/* <ButtonSecondary disabled={loading} to=".">
              {t("shared.reload")}
            </ButtonSecondary> */}

            <ButtonPrimary to="new" disabled={loading || !getUserHasPermission(adminData, "admin.pricing.create")}>
              {t("shared.new")}
            </ButtonPrimary>
          </Form>
        </div>

        {createdPlans() === 0 && (
          <WarningBanner title={t("shared.warning")} text={t("admin.pricing.thesePricesAreFromFiles")}>
            <div className="mt-2 flex items-center space-x-2">
              <div className="w-44">
                <InputSelect
                  name="model"
                  title={t("models.subscriptionProduct.model")}
                  withLabel={false}
                  value={model}
                  setValue={(e) => {
                    setModel(Number(e));
                  }}
                  options={[
                    {
                      name: t("pricing." + PricingModel[PricingModel.FLAT_RATE]),
                      value: PricingModel.FLAT_RATE,
                    },
                    {
                      name: t("pricing." + PricingModel[PricingModel.PER_SEAT]),
                      value: PricingModel.PER_SEAT,
                    },
                    {
                      name: t("pricing." + PricingModel[PricingModel.USAGE_BASED]),
                      value: PricingModel.USAGE_BASED,
                    },
                    {
                      name: t("pricing." + PricingModel[PricingModel.FLAT_RATE_USAGE_BASED]),
                      value: PricingModel.FLAT_RATE_USAGE_BASED,
                    },
                    {
                      name: t("pricing." + PricingModel[PricingModel.ONCE]),
                      value: PricingModel.ONCE,
                    },
                    {
                      name: t("shared.all"),
                      value: PricingModel.ALL,
                    },
                  ]}
                />
              </div>
              <ButtonSecondary
                type="button"
                onClick={createAllPlans}
                disabled={loading || createdPlans() > 0 || !getUserHasPermission(adminData, "admin.pricing.create")}
              >
                {t("admin.pricing.generateFromFiles")}
              </ButtonSecondary>
            </div>
          </WarningBanner>
        )}

        <TableSimple
          items={sortedItems()}
          headers={[
            {
              name: "order",
              title: t("models.subscriptionProduct.order"),
              value: (i) => i.order,
            },
            {
              name: "title",
              title: t("models.subscriptionProduct.title"),
              value: (item) => (
                <>
                  {t(item.title)}{" "}
                  {item.badge && (
                    <span className=" ml-1 rounded-md border border-theme-200 bg-theme-50 px-1 py-0.5 text-xs text-theme-800">{t(item.badge)}</span>
                  )}
                </>
              ),
            },
            {
              name: "model",
              title: t("models.subscriptionProduct.model"),
              value: (item) => <>{t("pricing." + PricingModel[item.model])}</>,
            },
            // ...allFeatures.map((feature) => {
            //   return {
            //     name: feature.name,
            //     title: feature.name,
            //     value: (item: SubscriptionProductDto) => <PlanFeatureValue item={getFeatureValue(item, feature.name)} />,
            //   };
            // }),
            {
              name: "subscriptions",
              title: t("models.subscriptionProduct.plural"),
              value: (item) => (
                <div className=" lowercase text-gray-400">
                  {item.tenantProducts?.length ?? 0} {t("shared.active")}
                </div>
              ),
            },
            {
              name: "active",
              title: t("models.subscriptionProduct.status"),
              value: (item) => (
                <>
                  {item.active ? (
                    <>
                      {item.public ? (
                        <SimpleBadge title={t("models.subscriptionProduct.public")} color={Colors.TEAL} />
                      ) : (
                        <SimpleBadge title={t("models.subscriptionProduct.custom")} color={Colors.ORANGE} />
                      )}
                    </>
                  ) : (
                    <SimpleBadge title={t("shared.inactive")} color={Colors.RED} />
                  )}
                </>
              ),
            },
            {
              name: "actions",
              title: t("shared.actions"),
              value: (item) => (
                <div className="flex items-center space-x-2">
                  <ButtonTertiary disabled={!item.id} to={"/pricing?plan=" + item.id} target="_blank">
                    {t("shared.preview")}
                  </ButtonTertiary>
                  <ButtonTertiary disabled={!item.id} to={"edit/" + item.id}>
                    {t("shared.edit")}
                  </ButtonTertiary>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Outlet />
      <SuccessModal ref={successModal} />
      <ErrorModal ref={errorModal} />
    </div>
  );
}
