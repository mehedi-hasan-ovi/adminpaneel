import { useTranslation } from "react-i18next";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Link, useActionData, useSearchParams } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenant } from "~/utils/db/tenants.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { Language } from "remix-i18next";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { AppLoaderData, loadAppData } from "~/utils/data/useAppData";
import PlansGrouped from "~/components/core/settings/subscription/plans/PlansGrouped";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import { getAllSubscriptionProducts, getSubscriptionProductsInIds } from "~/utils/db/subscriptionProducts.db.server";
import { getOrPersistTenantSubscription, updateTenantSubscriptionCustomerId } from "~/utils/db/tenantSubscriptions.db.server";
import { createStripeCheckoutSession, createStripeCustomer } from "~/utils/stripe.server";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import { useEffect, useRef } from "react";
import SubscriptionHelper from "~/utils/helpers/SubscriptionHelper";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = AppLoaderData & {
  title: string;
  i18n: Record<string, Language>;
  items: SubscriptionProductDto[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "subscribe.$tenant");
  let { t, translations } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  const userInfo = await getUserInfo(request);

  const user = await getUser(userInfo.userId);
  if (!user) {
    throw redirect(`/login`);
  }
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw redirect(`/app`);
  }

  const appData = await time(loadAppData({ request, params }, time), "loadAppData");
  let items = await getAllSubscriptionProducts(true);
  const searchParams = new URL(request.url).searchParams;
  const planParam = searchParams.get("plan")?.toString();
  if (planParam) {
    items = await getSubscriptionProductsInIds([planParam]);
  }
  const data: LoaderData = {
    title: `${t("pricing.subscribe")} | ${process.env.APP_NAME}`,
    ...appData,
    i18n: translations,
    items,
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
  const form = await request.formData();

  const tenantSubscription = await getOrPersistTenantSubscription(tenantId);
  const user = await getUser(userInfo.userId);
  const tenant = await getTenant(tenantId);

  if (!tenantSubscription.stripeCustomerId && user && tenant) {
    const customer = await createStripeCustomer(user.email, tenant.name);
    if (customer) {
      tenantSubscription.stripeCustomerId = customer.id;
      await updateTenantSubscriptionCustomerId(tenant.id, {
        stripeCustomerId: customer.id,
      });
    }
  }

  const action = form.get("action")?.toString();

  if (!tenantSubscription || !tenantSubscription?.stripeCustomerId) {
    return badRequest({
      error: "Invalid stripe customer",
    });
  }

  if (action === "subscribe") {
    try {
      const selectedPlan = await SubscriptionHelper.getPlanFromForm(form);
      const session = await createStripeCheckoutSession({
        customer: tenantSubscription.stripeCustomerId,
        line_items: selectedPlan.line_items,
        mode: selectedPlan.mode,
        success_url: `${request.url}/{CHECKOUT_SESSION_ID}/success`,
        cancel_url: `${request.url}`,
        freeTrialDays: selectedPlan.freeTrialDays,
        coupon: selectedPlan.coupon,
      });
      if (!session || !session.url) {
        return badRequest({
          error: "Could not update subscription",
        });
      }
      return redirect(session.url);
    } catch (e: any) {
      return badRequest({ error: t(e.message) });
    }
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

interface AppSubscriptionProps {
  data: LoaderData;
  actionData: ActionData | undefined;
}

function AppSubscription({ data, actionData }: AppSubscriptionProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const errorModal = useRef<RefErrorModal>(null);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData.error);
    }
  }, [actionData]);

  function canSubscribe() {
    return getUserHasPermission(data, "app.settings.subscription.update");
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-4 overflow-hidden px-2 py-12 sm:py-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("front.pricing.title")}</h1>
        <p className="mt-4 text-lg leading-6 text-gray-500 dark:text-gray-400">
          {searchParams.get("error")?.toString() === "subscription_required" ? (
            <span className="text-red-500">{t("pricing.required")}</span>
          ) : (
            <span>{t("front.pricing.headline")}</span>
          )}
        </p>
      </div>
      {data?.items && <PlansGrouped items={data.items} canSubmit={canSubscribe()} tenantSubscription={data.mySubscription} />}
      <ErrorModal ref={errorModal} />
    </div>
  );
}

export default function AppSubscriptionRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  function goBackLink() {
    return (
      <div className="mt-4 flex">
        <Link
          to={`/app/${data.currentTenant.slug}/settings/subscription`}
          className="w-full text-center text-sm font-medium text-theme-600 hover:text-theme-500 dark:text-theme-400"
        >
          <span aria-hidden="true"> &larr;</span> Go to my subscription
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white pt-4 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div className="flex flex-shrink-0 justify-center">{goBackLink()}</div>
          <div className="sm:align-center sm:flex sm:flex-col">
            <AppSubscription data={data} actionData={actionData} />
          </div>
        </div>
      </div>
    </div>
  );
}
