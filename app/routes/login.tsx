import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { createUserSession, getUserInfo, setLoggedUser } from "~/utils/session.server";
import bcrypt from "bcryptjs";
import Logo from "~/components/brand/Logo";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import { useTranslation } from "react-i18next";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUser, getUserByEmail } from "~/utils/db/users.db.server";
import UserUtils from "~/utils/app/UserUtils";
import { createLogLogin } from "~/utils/db/logs.db.server";
import { getTenant } from "~/utils/db/tenants.db.server";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import GitHubIcon from "~/components/ui/icons/GitHubIcon";
import { useRootData } from "~/utils/data/useRootData";
import GoogleIcon from "~/components/ui/icons/GoogleIcon";
import ExclamationTriangleIcon from "~/components/ui/icons/ExclamationTriangleIcon";

export let loader: LoaderFunction = async ({ request }) => {
  let { t, translations } = await i18nHelper(request);

  const userInfo = await getUserInfo(request);
  if (userInfo.userId !== undefined && userInfo.userId !== "") {
    const user = await getUser(userInfo.userId);
    if (user) {
      if (!user?.defaultTenantId) {
        return redirect("/app");
      } else {
        const tenant = await getTenant(user.defaultTenantId);
        if (tenant) {
          return redirect(`/app/${tenant?.slug ?? tenant.id}`);
        }
      }
    }
  }

  return json({
    title: `${t("account.login.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
  });
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
  };
};

export const action: ActionFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);

  const form = await request.formData();
  const email = form.get("email")?.toString().toLowerCase().trim();
  const password = form.get("password");
  const redirectTo = form.get("redirectTo");
  if (typeof email !== "string" || typeof password !== "string" || typeof redirectTo !== "string") {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }

  const fields = { email, password };
  const fieldErrors = {
    email: !UserUtils.validateEmail(email) ? "Invalid email" : undefined,
    password: !UserUtils.validatePassword(password) ? "Invlaid password" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean)) return json({ fieldErrors, fields }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) {
    return json({ fields, error: t("api.errors.userNotRegistered") }, { status: 400 });
  }

  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) {
    return json({ fields, error: t("api.errors.invalidPassword") }, { status: 400 });
  }

  await createLogLogin(request, user);
  const userSession = await setLoggedUser(user);
  const tenant = await getTenant(userSession.defaultTenantId);
  return createUserSession(
    {
      ...userInfo,
      ...userSession,
      lng: user.locale ?? userInfo.lng,
    },
    redirectTo.length > 0 ? redirectTo : user.admin !== null ? "/admin/dashboard" : `/app/${tenant?.slug}/dashboard`
  );
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function LoginRoute() {
  const { t } = useTranslation();
  const actionData = useActionData<ActionData>();
  const { appConfiguration } = useRootData();
  const navigation = useNavigation();

  const [searchParams] = useSearchParams();

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-5">
          <Logo className="mx-auto h-9" />
          <div className="flex flex-col items-center">
            <h1 className="text-left text-xl font-extrabold">{t("account.login.headline")}</h1>
            <p className="mt-1 text-left text-sm">
              <Link to="/register" className="text-theme-600 hover:text-theme-700 hover:underline dark:text-theme-400 dark:hover:text-theme-500">
                {t("account.login.orRegister")}.
              </Link>
            </p>
          </div>

          {/* <InfoBanner title="Guest Demo Account" text="">
            <b>email:</b>
            <span className="select-all">guest@admin.com</span>, <b>password:</b>
            <span className="select-all">password</span>.
          </InfoBanner> */}

          <div className="mx-auto flex flex-col items-center space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            {/* <!-- SSO: START --> */}
            {(appConfiguration.auth.authMethods.github.enabled || appConfiguration.auth.authMethods.google.enabled) && (
              <>
                <div className="w-full space-y-3 text-center">
                  {/* GitHub */}
                  {appConfiguration.auth.authMethods.github.enabled && (
                    <div>
                      <ButtonPrimary
                        className="block w-full justify-center bg-gray-900 hover:bg-black dark:focus:ring-gray-700"
                        to={appConfiguration.auth.authMethods.github.authorizationURL}
                        isExternal
                      >
                        <GitHubIcon className="mr-2 h-4 w-4 text-white" /> {t("auth.github.button")}
                      </ButtonPrimary>
                    </div>
                  )}
                  {/* GitHub: End */}
                  {/* Google */}
                  {appConfiguration.auth.authMethods.google.enabled && (
                    <Form action="/oauth/google" method="post">
                      <ButtonPrimary type="submit" className="block w-full justify-center bg-blue-600 hover:bg-[#2e70d9] dark:focus:ring-blue-700">
                        <GoogleIcon className="mr-2 h-4 w-4 text-white" /> {t("auth.google.button")}
                      </ButtonPrimary>
                    </Form>
                  )}
                  {/* Google: End */}
                </div>

                {appConfiguration.auth.authMethods.emailPassword.enabled && (
                  <div className="w-full border-t-2 border-dotted border-gray-200 dark:border-gray-900"></div>
                )}
              </>
            )}
            {/* <!-- SSO: END --> */}

            {appConfiguration.auth.authMethods.emailPassword.enabled && (
              <Form method="post" className="w-full space-y-3">
                <input type="hidden" name="action" value="with-email" />
                <input type="hidden" name="redirectTo" value={searchParams.get("redirect") ?? undefined} />
                <div>
                  <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="email">
                    {t("account.shared.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                    placeholder="email@address.com"
                    disabled={navigation.state !== "idle"}
                  />
                  {actionData?.fieldErrors?.email ? (
                    <p className="py-2 text-xs text-rose-500" role="alert" id="email-error">
                      {actionData.fieldErrors.email}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="password">
                    {t("account.shared.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                    placeholder="************"
                    disabled={navigation.state !== "idle"}
                  />
                  {actionData?.fieldErrors?.password ? (
                    <p className="py-2 text-xs text-rose-500" role="alert" id="password-error">
                      {actionData.fieldErrors.password}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <Link to="/forgot-password" className="inline-block align-baseline text-xs font-medium text-theme-500 hover:text-theme-600 hover:underline">
                    {t("account.login.forgot")}
                  </Link>
                  <LoadingButton
                    isLoading={navigation.state !== "idle"}
                    className="block w-full hover:bg-black dark:bg-gray-900"
                    type="submit"
                    actionName="with-email"
                  >
                    {t("account.login.button")}
                  </LoadingButton>
                </div>
                <div id="form-error-message">
                  {actionData?.error ? (
                    <div className="flex items-center justify-center space-x-2 text-sm text-red-500 dark:text-red-300" role="alert">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <div>{actionData.error}</div>
                    </div>
                  ) : null}
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
