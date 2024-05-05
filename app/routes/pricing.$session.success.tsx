import { useTranslation } from "react-i18next";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import Logo from "~/components/brand/Logo";
import { i18nHelper } from "~/locale/i18n.utils";
import { Language } from "remix-i18next";
import { useEffect } from "react";
import { addTenantProductsFromCheckoutSession, CheckoutSessionResponse, getAcquiredItemsFromCheckoutSession } from "~/utils/services/pricingService";
import { createUserSession, getUserInfo, setLoggedUser } from "~/utils/session.server";
import { createLog } from "~/utils/db/logs.db.server";
import { persistCheckoutSessionStatus } from "~/utils/services/subscriptionService";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { getRegistrationFormData } from "~/utils/services/authService";
import { validateRegistration } from "~/utils/services/authService";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  i18n: Record<string, Language>;
  checkoutSession: CheckoutSessionResponse | null;
  error?: string;
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t, translations } = await i18nHelper(request);

  await persistCheckoutSessionStatus({
    id: params.session ?? "",
    fromUrl: new URL(request.url).pathname,
  });
  const checkoutSession = await getAcquiredItemsFromCheckoutSession(params.session ?? "");
  const data: LoaderData = {
    title: `${t("account.register.setup")} | ${process.env.APP_NAME}`,
    i18n: translations,
    checkoutSession,
  };

  if (!checkoutSession) {
    return json({ ...data, error: t("settings.subscription.checkout.invalid") }, { status: 400 });
  } else if (!checkoutSession.status?.pending) {
    return json({ ...data, error: t("settings.subscription.checkout.alreadyProcessed") }, { status: 400 });
  }

  return json(data);
};

type ActionData = {
  error?: string;
  fieldErrors?: {
    email: string | undefined;
    password: string | undefined;
  };
  fields?: {
    email: string;
    password: string;
    company: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);

  const checkoutSession = await getAcquiredItemsFromCheckoutSession(params.session ?? "");
  if (!checkoutSession) {
    return badRequest({ error: t("settings.subscription.checkout.invalid") });
  } else if (!checkoutSession.status?.pending) {
    return badRequest({ error: t("settings.subscription.checkout.alreadyProcessed") });
  } else if (!checkoutSession.customer?.id) {
    return badRequest({ error: t("settings.subscription.checkout.invalidCustomer") });
  }

  try {
    const registrationData = await getRegistrationFormData(request);
    const result = await validateRegistration(request, registrationData, false, checkoutSession.customer.id);
    if (!result.registered) {
      return badRequest({ error: t("shared.unknownError") });
    }
    const tenantId = result.registered.tenant.id;
    await addTenantProductsFromCheckoutSession({
      tenantId,
      user: result.registered.user,
      checkoutSession,
      createdUserId: result.registered.user.id,
      createdTenantId: result.registered.tenant.id,
      t,
    });
    await Promise.all(
      checkoutSession.products.map(async (product) => {
        await createLog(request, tenantId, "Subscribed", t(product.title ?? ""));
      })
    );
    const userSession = await setLoggedUser(result.registered.user);
    return createUserSession(
      {
        ...userInfo,
        ...userSession,
        lng: result.registered.user.locale ?? userInfo.lng,
      },
      `/app/${encodeURIComponent(result.registered.tenant.slug)}/dashboard`
    );
  } catch (e: any) {
    return badRequest({ error: e.message });
  }
};

function ThankYou({ checkoutSession }: { checkoutSession: any }) {
  const { t } = useTranslation();
  const productNames = checkoutSession.products.map((product: any) => t(product.title)).join(", ");

  return (
    <>
      <h1 className="text-left text-xl font-extrabold">{t("account.register.setup")}</h1>
      <p className="mt-1 text-center text-sm">{t("pricingSubscribedSuccessRoute.thankYou", { productNames })}</p>
    </>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <>
      <h1 className="text-left text-xl font-extrabold">{error}</h1>
      <p className="mt-1 text-center text-sm text-red-500">{error}</p>
    </>
  );
}

function PricingSubscribedSuccessRoute() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  useEffect(() => {
    try {
      // @ts-ignore
      $crisp.push(["do", "chat:hide"]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-5">
          <Logo className="mx-auto h-12 w-auto" />

          <div className="flex flex-col items-center">
            {data.error ? (
              <ErrorMessage error={data.error} />
            ) : !data.checkoutSession ? (
              <ErrorMessage error="Invalid checkout session" />
            ) : (
              <ThankYou checkoutSession={data.checkoutSession} />
            )}
          </div>

          {data.checkoutSession && !data.error && (
            <RegisterForm
              data={{
                company: actionData?.fields?.company,
                firstName: actionData?.fields?.firstName,
                lastName: actionData?.fields?.lastName,
                email: data.checkoutSession.customer.email,
              }}
              error={actionData?.error}
              isSettingUpAccount={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingSubscribedSuccessRoute;
