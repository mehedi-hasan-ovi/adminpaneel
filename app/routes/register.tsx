import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Link, useActionData } from "@remix-run/react";
import { createUserSession, getUserInfo, setLoggedUser, validateCSRFToken } from "~/utils/session.server";
import Logo from "~/components/brand/Logo";
import { TFunction, useTranslation } from "react-i18next";
import { i18nHelper } from "~/locale/i18n.utils";
import { createRegistrationForm, validateRegistration, getRegistrationFormData } from "~/utils/services/authService";
import { getAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import { RegisterForm } from "~/components/auth/RegisterForm";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export let loader: LoaderFunction = async ({ request }) => {
  let { t, translations } = await i18nHelper(request);
  const appConfiguration = await getAppConfiguration();
  if (!appConfiguration.subscription.allowSignUpBeforeSubscribe) {
    return redirect("/pricing");
  }
  return json({
    title: `${t("account.register.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
  });
};

type ActionData = {
  error?: string;
  verificationEmailSent?: boolean;
};

const success = (data: ActionData) => json(data, { status: 200 });
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);

  try {
    await validateCSRFToken(request);
    const registrationData = await getRegistrationFormData(request);
    const result = await validateRegistration(request, registrationData);
    if (result.verificationRequired) {
      await createRegistrationForm({ ...registrationData, email: result.email, ipAddress: result.ipAddress, recreateToken: false });
      return success({ verificationEmailSent: true });
    } else if (result.registered) {
      const userSession = await setLoggedUser(result.registered.user);
      return createUserSession(
        {
          ...userInfo,
          ...userSession,
          lng: result.registered.user.locale ?? userInfo.lng,
        },
        `/app/${encodeURIComponent(result.registered.tenant.slug)}/dashboard`
      );
    }
    return badRequest({ error: t("shared.unknownError") });
  } catch (e: any) {
    return badRequest({ error: t(e.message) });
  }
};

function RegisterTitle({ isVerificationEmailSent, t }: { isVerificationEmailSent: boolean | undefined; t: TFunction }) {
  return <h1 className="text-left text-xl font-extrabold">{isVerificationEmailSent ? t("account.verify.title") : t("account.register.title")}</h1>;
}

function RegisterSubTitle({ isVerificationEmailSent, t }: { isVerificationEmailSent: boolean | undefined; t: TFunction }) {
  return (
    <p className="mt-1 text-center text-sm">
      {isVerificationEmailSent ? (
        t("account.verify.emailSent")
      ) : (
        <Link to="/login" className="text-theme-600 hover:text-theme-700 hover:underline dark:text-theme-400 dark:hover:text-theme-500">
          {t("account.register.clickHereToLogin")}
        </Link>
      )}
    </p>
  );
}

export default function RegisterRoute() {
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();

  const isVerificationEmailSent = actionData?.verificationEmailSent;

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-5">
          <Logo className="mx-auto h-9" />
          <div className="flex flex-col items-center">
            <RegisterTitle isVerificationEmailSent={isVerificationEmailSent} t={t} />
            <RegisterSubTitle isVerificationEmailSent={isVerificationEmailSent} t={t} />
          </div>

          {!isVerificationEmailSent && <RegisterForm requireRecaptcha error={actionData?.error} />}
        </div>
      </div>
    </div>
  );
}
