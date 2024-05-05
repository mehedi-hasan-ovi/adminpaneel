import { TFunction, useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import { json, LoaderArgs, redirect } from "@remix-run/node";
import Logo from "~/components/brand/Logo";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenant } from "~/utils/db/tenants.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { Language } from "remix-i18next";
import { AppLoaderData, loadAppData } from "~/utils/data/useAppData";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { addTenantProductsFromCheckoutSession, CheckoutSessionResponse, getAcquiredItemsFromCheckoutSession } from "~/utils/services/pricingService";
import { createLog } from "~/utils/db/logs.db.server";
import { persistCheckoutSessionStatus } from "~/utils/services/subscriptionService";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";

type LoaderData = AppLoaderData & {
  title: string;
  i18n: Record<string, Language>;
  checkoutSession: CheckoutSessionResponse | null;
  error?: string;
};

export let loader = async ({ request, params }: LoaderArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "subscribe.$tenant.$session.success");
  let { t, translations } = await time(i18nHelper(request), "i18nHelper");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const userInfo = await time(getUserInfo(request), "getUserInfo");

  const user = await time(getUser(userInfo.userId), "getUser");
  if (!user) {
    throw redirect(`/login`);
  }
  const tenant = await time(getTenant(tenantId), "getTenant");
  if (!tenant) {
    throw redirect(`/app`);
  }

  await time(
    persistCheckoutSessionStatus({
      id: params.session ?? "",
      fromUrl: new URL(request.url).pathname,
      fromUserId: user.id,
      fromTenantId: tenant.id,
    }),
    "persistCheckoutSessionStatus"
  );
  const checkoutSession = await time(getAcquiredItemsFromCheckoutSession(params.session ?? ""), "getAcquiredItemsFromCheckoutSession");

  const appData = await time(loadAppData({ request, params }, time), "loadAppData");
  const data: LoaderData = {
    title: `${t("pricing.subscribe")} | ${process.env.APP_NAME}`,
    ...appData,
    i18n: translations,
    checkoutSession,
  };

  if (checkoutSession) {
    try {
      await time(
        addTenantProductsFromCheckoutSession({
          tenantId: tenantId,
          user,
          checkoutSession,
          createdUserId: null,
          createdTenantId: null,
          t,
        }),
        "addTenantProductsFromCheckoutSession"
      );
      await Promise.all(
        checkoutSession.products.map(async (product) => {
          await createLog(request, tenantId, "Subscribed", t(product.title ?? ""));
        })
      );
      return json(data, { headers: getServerTimingHeader() });
      // return redirect(`/subscribe/${params.tenant}/${params.product}/success`);
    } catch (e: any) {
      return json({ ...data, error: e.message }, { status: 500, headers: getServerTimingHeader() });
    }
  }
  return json(data);
};

function Svgs() {
  return (
    <>
      <svg className="absolute left-full translate-x-1/2 transform" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
        <defs>
          <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
      </svg>
      <svg className="absolute bottom-0 right-full -translate-x-1/2 transform" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
        <defs>
          <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
      </svg>
    </>
  );
}

const SuccessContent = ({ t, checkoutSession }: { t: TFunction; checkoutSession: LoaderData["checkoutSession"] }) => (
  <>
    <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">
      {t("settings.subscription.checkout.success.title")}
    </h1>
    <p className="mt-4 text-lg leading-6 text-gray-500">
      {checkoutSession && t("settings.subscription.checkout.success.description", [t(checkoutSession.products.map((f) => t(f.title)).join(", "))])}
    </p>
  </>
);

const ErrorContent = ({ t, errorMessage }: { t: TFunction; errorMessage: string }) => (
  <>
    <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("shared.unexpectedError")}</h1>
    <p className="mt-4 text-lg leading-6 text-red-500">{errorMessage}</p>
  </>
);

const CheckoutErrorContent = ({ t }: { t: TFunction }) => (
  <>
    <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("shared.error")}</h1>
    <p className="mt-4 text-lg leading-6 text-red-500">{t("settings.subscription.checkout.invalid")}</p>
  </>
);

export default function SubscribeTenantSuccessRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();

  const Content = () => {
    if (data.error) {
      return <ErrorContent t={t} errorMessage={data.error} />;
    }
    if (!data.checkoutSession) {
      return <CheckoutErrorContent t={t} />;
    }
    return <SuccessContent t={t} checkoutSession={data.checkoutSession} />;
  };

  return (
    <div className="bg-white pt-20 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <div className="flex flex-shrink-0 justify-center">
          <Logo to={`/app/${data.currentTenant.slug}`} />
        </div>
        <div className="sm:align-center sm:flex sm:flex-col">
          <div className="relative mx-auto w-full max-w-xl overflow-hidden px-2 py-12 sm:py-6">
            <Svgs />
            <div className="text-center">
              <Content />
              <div className="mt-4">
                <Link
                  className="inline-flex items-center space-x-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:border-accent-300 focus:outline-none focus:ring-2 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  to={`/app/${data.currentTenant.slug}/settings/subscription`}
                >
                  &larr; {t("settings.subscription.checkout.success.goToSubscription")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
