import { useTranslation } from "react-i18next";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import SuccessModal, { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { useRef, useEffect } from "react";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Link, useActionData, useSubmit } from "@remix-run/react";
import { getAllSubscriptionProducts } from "~/utils/db/subscriptionProducts.db.server";
import {
  cancelStripeSubscription,
  createStripeSetupSession,
  deleteStripePaymentMethod,
  getStripeCustomer,
  getStripeInvoices,
  getStripePaymentIntents,
  getStripePaymentMethods,
  getStripeSubscription,
  getStripeUpcomingInvoice,
} from "~/utils/stripe.server";
import { getUserInfo } from "~/utils/session.server";
import { getUser } from "~/utils/db/users.db.server";
import { useAppData } from "~/utils/data/useAppData";
import MySubscriptionFeatures from "~/components/core/settings/subscription/MySubscriptionFeatures";
import { DashboardLoaderData, loadDashboardData } from "~/utils/data/useDashboardData";
import { i18nHelper } from "~/locale/i18n.utils";
import MyInvoices from "~/components/core/settings/subscription/MyInvoices";
import Stripe from "stripe";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { getOrPersistTenantSubscription, getTenantSubscription } from "~/utils/db/tenantSubscriptions.db.server";
import { getTenant } from "~/utils/db/tenants.db.server";
import { getPlanFeaturesUsage } from "~/utils/services/subscriptionService";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { createSubscriptionCancelledEvent } from "~/utils/services/events/subscriptionsEventsService";
import SettingSection from "~/components/ui/sections/SettingSection";
import MyUpcomingInvoice from "~/components/core/settings/subscription/MyUpcomingInvoice";
import MyProducts from "~/components/core/settings/subscription/MyProducts";
import MyPayments from "~/components/core/settings/subscription/MyPayments";
import MyPaymentMethods from "~/components/core/settings/subscription/MyPaymentMethods";
import { useTypedLoaderData } from "remix-typedjson";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { promiseHash } from "~/utils/promises/promiseHash";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import {
  TenantSubscriptionProductWithDetails,
  cancelTenantSubscriptionProduct,
  getTenantSubscriptionProductById,
} from "~/utils/db/subscriptions/tenantSubscriptionProducts.db.server";
export { serverTimingHeaders as headers };

type LoaderData = DashboardLoaderData & {
  title: string;
  products: Awaited<ReturnType<typeof getAllSubscriptionProducts>>;
  customer: Stripe.Customer | Stripe.DeletedCustomer | null;
  myInvoices: Stripe.Invoice[];
  myPayments: Stripe.PaymentIntent[];
  myFeatures: PlanFeatureUsageDto[];
  myUpcomingInvoice: Stripe.Invoice | null;
  myPaymentMethods: Stripe.PaymentMethod[];
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.settings.subscription");
  let { t } = await time(i18nHelper(request), "i18nHelper");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  await time(verifyUserHasPermission(request, "app.settings.subscription.view", tenantId), "verifyUserHasPermission");

  const userInfo = await time(getUserInfo(request), "getUserInfo");
  const user = await time(getUser(userInfo.userId), "getUser");
  if (!user) {
    return badRequest({ error: "Invalid user" });
  }
  const tenant = await time(getTenant(tenantId), "getTenant");
  if (!tenant) {
    return badRequest({ error: "Invalid tenant with id: " + tenantId });
  }

  const tenantSubscription = await time(getOrPersistTenantSubscription(tenantId), "getOrPersistTenantSubscription");
  const { customer, myInvoices, myPayments, myUpcomingInvoice, myPaymentMethods, myFeatures, dashboardData, products } = await time(
    promiseHash({
      customer: getStripeCustomer(tenantSubscription.stripeCustomerId),
      myInvoices: getStripeInvoices(tenantSubscription.stripeCustomerId) ?? [],
      myPayments: getStripePaymentIntents(tenantSubscription.stripeCustomerId, "succeeded") ?? [],
      myUpcomingInvoice: getStripeUpcomingInvoice(tenantSubscription.stripeCustomerId),
      myPaymentMethods: getStripePaymentMethods(tenantSubscription.stripeCustomerId),
      myFeatures: getPlanFeaturesUsage(tenantId),
      dashboardData: loadDashboardData(params),
      products: getAllSubscriptionProducts(true),
    }),
    "subscription[getStripeData]"
  );
  const data: LoaderData = {
    title: `${t("app.navbar.subscription")} | ${process.env.APP_NAME}`,
    customer,
    products,
    myFeatures,
    myInvoices,
    myPayments,
    myUpcomingInvoice,
    myPaymentMethods,
    ...dashboardData,
  };
  return json(data, { headers: getServerTimingHeader() });
};

type ActionData = {
  error?: string;
  success?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  const userInfo = await getUserInfo(request);
  const tenantSubscription = await getTenantSubscription(tenantId);
  const form = await request.formData();

  const action = form.get("action")?.toString();

  if (!tenantSubscription || !tenantSubscription?.stripeCustomerId) {
    return badRequest({
      error: "Invalid stripe customer",
    });
  } else if (action === "cancel") {
    const tenantSubscriptionProductId = form.get("tenant-subscription-product-id")?.toString() ?? "";
    const tenantSubscriptionProduct = await getTenantSubscriptionProductById(tenantSubscriptionProductId);
    if (!tenantSubscriptionProduct?.stripeSubscriptionId) {
      return badRequest({ error: "Not subscribed" });
    }
    const user = await getUser(userInfo.userId);
    if (user) {
      await createSubscriptionCancelledEvent(tenantId, {
        user: { id: user.id, email: user.email },
        subscription: {
          product: { id: tenantSubscriptionProduct.subscriptionProductId, title: t(tenantSubscriptionProduct.subscriptionProduct.title) },
        },
      });
    }
    await cancelStripeSubscription(tenantSubscriptionProduct?.stripeSubscriptionId);
    const stripeSubscription = await getStripeSubscription(tenantSubscriptionProduct.stripeSubscriptionId);
    await cancelTenantSubscriptionProduct(tenantSubscriptionProduct.id, {
      cancelledAt: new Date(),
      endsAt: stripeSubscription?.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : new Date(),
    });
    const actionData: ActionData = {
      success: "Successfully cancelled",
    };
    return json(actionData);
  } else if (action === "add-payment-method") {
    const session = await createStripeSetupSession(request, tenantSubscription.stripeCustomerId);
    return redirect(session?.url ?? "");
  } else if (action === "delete-payment-method") {
    await deleteStripePaymentMethod(form.get("id")?.toString() ?? "");
    return json({});
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function SubscriptionRoute() {
  const appData = useAppData();
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();
  const submit = useSubmit();

  const errorModal = useRef<RefErrorModal>(null);
  const successModal = useRef<RefSuccessModal>(null);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData?.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  function onCancel(item: TenantSubscriptionProductWithDetails) {
    const form = new FormData();
    form.set("action", "cancel");
    form.set("tenant-subscription-product-id", item.id);
    submit(form, {
      method: "post",
    });
  }

  function onAddPaymentMethod() {
    const form = new FormData();
    form.set("action", "add-payment-method");
    submit(form, {
      method: "post",
    });
  }

  function onDeletePaymentMethod(id: string) {
    const form = new FormData();
    form.set("action", "delete-payment-method");
    form.set("id", id);
    submit(form, {
      method: "post",
    });
  }

  return (
    <EditPageLayout>
      <div className="space-y-4">
        <SettingSection
          title={t("settings.subscription.title")}
          description={
            <div className="flex flex-col space-y-1">
              <div>{t("settings.subscription.description")}</div>
              <div>
                {appData.mySubscription?.products && appData.mySubscription.products.length > 0 && (
                  <Link to={`/subscribe/${appData.currentTenant.slug}`} className="underline">
                    {t("settings.subscription.viewAllProducts")}
                  </Link>
                )}
              </div>
            </div>
          }
          className=""
        >
          <MyProducts items={appData.mySubscription?.products ?? []} onCancel={onCancel} />
        </SettingSection>

        {data.myFeatures.length > 0 && (
          <>
            <div className="hidden sm:block" aria-hidden="true">
              <div className="py-4">
                <div className="border-t border-gray-200"></div>
              </div>
            </div>

            <SettingSection title={t("app.subscription.features.title")} description={t("app.subscription.features.description")} className="">
              <MySubscriptionFeatures features={data.myFeatures} withCurrentPlan={false} />
            </SettingSection>
          </>
        )}

        {getUserHasPermission(appData, "app.settings.subscription.invoices.view") && data.myInvoices.length > 0 && (
          <>
            <div className="hidden sm:block" aria-hidden="true">
              <div className="py-4">
                <div className="border-t border-gray-200"></div>
              </div>
            </div>

            <SettingSection title={t("app.subscription.invoices.title")} description={t("app.subscription.invoices.description")}>
              <div className="space-y-2">
                <MyUpcomingInvoice item={data.myUpcomingInvoice} />
                <MyInvoices items={data.myInvoices} />
                <MyPayments items={data.myPayments} />
              </div>
            </SettingSection>
          </>
        )}

        <div className="hidden sm:block" aria-hidden="true">
          <div className="py-4">
            <div className="border-t border-gray-200"></div>
          </div>
        </div>

        <SettingSection title={t("app.subscription.paymentMethods.title")} description={t("app.subscription.paymentMethods.description")}>
          <div className="space-y-2">
            <MyPaymentMethods items={data.myPaymentMethods} onAdd={onAddPaymentMethod} onDelete={onDeletePaymentMethod} />
          </div>
        </SettingSection>
      </div>

      <SuccessModal ref={successModal} />
      <ErrorModal ref={errorModal} />
    </EditPageLayout>
  );
}
