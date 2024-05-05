import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createUserSession, getUserInfo, setLoggedUser } from "~/utils/session.server";
import Logo from "~/components/brand/Logo";
import { TFunction, useTranslation } from "react-i18next";
import { i18nHelper } from "~/locale/i18n.utils";
import { Language } from "remix-i18next";
import { Registration } from "@prisma/client";
import { getRegistrationByToken } from "~/utils/db/registration.db.server";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { getRegistrationFormData } from "~/utils/services/authService";
import { validateRegistration } from "~/utils/services/authService";
import { useTypedActionData, useTypedLoaderData } from "remix-typedjson";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  i18n: Record<string, Language>;
  registration: Registration | null;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  let { t, translations } = await i18nHelper(request);
  const registration = await getRegistrationByToken(params.id ?? "");
  const data: LoaderData = {
    title: `${t("account.verify.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
    registration,
  };
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

  const registration = await getRegistrationByToken(params.id ?? "");
  if (!registration || registration.createdTenantId) {
    return badRequest({ error: t("api.errors.userAlreadyRegistered") });
  }

  try {
    const registrationData = await getRegistrationFormData(request);
    const result = await validateRegistration(request, registrationData, false);
    if (!result.registered) {
      return badRequest({ error: t("shared.unknownError") });
    }
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

// RegisterFormWithVerifyEmail.tsx
interface RegisterFormWithVerifyEmailProps {
  data: LoaderData;
  actionData: ActionData | null;
  t: TFunction;
}

export function RegisterFormWithVerifyEmail({ data, actionData, t }: RegisterFormWithVerifyEmailProps) {
  return (
    <div>
      <h1 className="mt-6 text-center text-lg font-bold leading-9 text-gray-800 dark:text-slate-200">{t("account.verify.title")}</h1>
      <p className="max-w mb-6 mt-2 text-center text-sm leading-5 text-gray-800 dark:text-slate-200">
        {t("account.register.alreadyRegistered")}{" "}
        <span className="font-medium text-theme-500 transition duration-150 ease-in-out hover:text-theme-400 focus:underline focus:outline-none">
          <Link to="/login">{t("account.register.clickHereToLogin")}</Link>
        </span>
      </p>
      <RegisterForm
        isVerifyingEmail
        data={{
          company: actionData?.fields?.company ?? data.registration?.company ?? "",
          firstName: actionData?.fields?.firstName ?? data.registration?.firstName,
          lastName: actionData?.fields?.lastName ?? data.registration?.lastName,
          email: actionData?.fields?.email ?? data.registration?.email,
        }}
        error={actionData?.error}
      />
    </div>
  );
}

// InvalidVerifyLink.tsx
interface InvalidVerifyLinkProps {
  t: TFunction;
}

export function InvalidVerifyLink({ t }: InvalidVerifyLinkProps) {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="mx-auto mb-4 w-full max-w-md rounded-sm px-8 pb-8">
        <div className="text-xl font-black">
          <h1 className="mt-6 text-center text-lg font-extrabold text-gray-800 dark:text-slate-200">{t("account.verify.title")}</h1>
        </div>
        <div className="my-4 leading-tight">
          <p className="max-w mt-2 text-center text-sm leading-5 text-red-900 dark:text-red-300">{t("account.verify.invalidLink")}</p>
        </div>
      </div>
    </div>
  );
}

// RegisterRoute.tsx
export default function RegisterRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedActionData<ActionData>();
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Logo className="mx-auto h-12 w-auto" />

          {data.registration && !data.registration.createdTenantId ? (
            <RegisterFormWithVerifyEmail data={data} actionData={actionData} t={t} />
          ) : (
            <InvalidVerifyLink t={t} />
          )}
        </div>
      </div>
    </div>
  );
}
