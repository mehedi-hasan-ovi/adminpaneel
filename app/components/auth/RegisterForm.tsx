import { Form, useNavigation, useSearchParams } from "@remix-run/react";
import clsx from "clsx";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "react-i18next";
import { useRootData } from "~/utils/data/useRootData";
import ButtonPrimary from "../ui/buttons/ButtonPrimary";
import LoadingButton from "../ui/buttons/LoadingButton";
import ExclamationTriangleIcon from "../ui/icons/ExclamationTriangleIcon";
import GitHubIcon from "../ui/icons/GitHubIcon";
import GoogleIcon from "../ui/icons/GoogleIcon";

interface Props {
  requireRecaptcha?: boolean;
  isVerifyingEmail?: boolean;
  isSettingUpAccount?: boolean;
  data?: { company?: string; firstName?: string; lastName?: string; email?: string };
  error: string | undefined;
}

export const RegisterForm = ({ requireRecaptcha = false, isVerifyingEmail = false, isSettingUpAccount = false, data = {}, error }: Props) => {
  const { t } = useTranslation();
  const { appConfiguration, userSession, csrf } = useRootData();
  const navigation = useNavigation();

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;
  const [registerButtonEnabled, setRegisterButtonEnabled] = useState(!appConfiguration.auth.recaptcha.enabled || !requireRecaptcha);
  const showPasswordInput = !appConfiguration.auth.requireEmailVerification || isVerifyingEmail || isSettingUpAccount;

  const reCaptcha = useRef(null);

  function onChangeReCaptcha() {
    // @ts-ignore;
    if (reCaptcha.current?.getValue()) {
      setRegisterButtonEnabled(true);
    }
  }

  return (
    <div className="mx-auto flex flex-col items-center space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
      {requireRecaptcha && appConfiguration.auth.recaptcha.enabled && (
        <ReCAPTCHA
          ref={reCaptcha}
          className="flex justify-center"
          sitekey={appConfiguration.auth.recaptcha.siteKey}
          onChange={onChangeReCaptcha}
          theme={userSession.lightOrDarkMode === "dark" ? "dark" : "light"}
        />
      )}
      <input type="hidden" name="redirectTo" value={redirect} />

      {/* <!-- SSO: START --> */}
      {!isVerifyingEmail && !isSettingUpAccount && (
        <>
          <div className="w-full space-y-3 text-center">
            {/* GitHub */}
            {appConfiguration.auth.authMethods.github.enabled && (
              <div>
                <ButtonPrimary
                  to={registerButtonEnabled ? appConfiguration.auth.authMethods.github.authorizationURL : undefined}
                  disabled={!registerButtonEnabled}
                  className={clsx(
                    "block w-full justify-center bg-gray-900 dark:focus:ring-gray-700",
                    registerButtonEnabled ? "hover:bg-black" : "cursor-not-allowed"
                  )}
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
                <ButtonPrimary
                  type="submit"
                  className={clsx(
                    "block w-full justify-center bg-blue-600 dark:focus:ring-blue-700",
                    registerButtonEnabled ? "hover:bg-[#2e70d9]" : "cursor-not-allowed"
                  )}
                  disabled={!registerButtonEnabled}
                >
                  <GoogleIcon className="mr-2 h-4 w-4 text-white" /> {t("auth.google.button")}
                </ButtonPrimary>
              </Form>
            )}
            {/* Google: End */}
          </div>

          {appConfiguration.auth.authMethods.emailPassword.enabled && appConfiguration.auth.authMethods.github.enabled && (
            <div className="w-full border-t-2 border-dotted border-gray-200 dark:border-gray-900"></div>
          )}
        </>
      )}
      {/* <!-- SSO: END --> */}

      {appConfiguration.auth.authMethods.emailPassword.enabled && (
        <Form method="post" className="w-full space-y-3">
          <input type="hidden" hidden readOnly name="csrf" value={csrf} />
          {/* Tenant */}
          {appConfiguration.auth.requireOrganization && (
            <div>
              <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="company">
                {t("models.tenant.object")}
              </label>
              <input
                disabled={navigation.state !== "idle"}
                autoFocus
                type="text"
                name="company"
                id="company"
                placeholder={t("account.shared.companyPlaceholder")}
                required
                defaultValue={data.company}
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
              />
            </div>
          )}
          {/* Tenant: End  */}

          {/* Personal Info */}
          {appConfiguration.auth.requireName && (
            <div className="flex -space-x-px space-y-4">
              <div className="w-1/2">
                <label htmlFor="first-name" className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                  {t("account.shared.name")}
                </label>
                <input
                  type="text"
                  name="first-name"
                  id="first-name"
                  required
                  defaultValue={data.firstName}
                  className="relative mt-1 block w-full appearance-none rounded-md rounded-r-none border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder={t("account.shared.firstNamePlaceholder")}
                  disabled={navigation.state !== "idle"}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="last-name" className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                  <span className="sr-only">{t("models.user.lastName")}</span>
                </label>
                <input
                  type="text"
                  name="last-name"
                  id="last-name"
                  defaultValue={data.lastName}
                  required
                  className="relative mt-1 block w-full appearance-none rounded-md rounded-l-none border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder={t("account.shared.lastNamePlaceholder")}
                  disabled={navigation.state !== "idle"}
                />
              </div>
            </div>
          )}

          <div>
            <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="email">
              {t("account.shared.email")}
            </label>
            <input
              type="text"
              id="email"
              name="email"
              autoComplete="email"
              required
              readOnly={isVerifyingEmail}
              defaultValue={data.email}
              className={clsx(
                "relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm",
                isVerifyingEmail && "cursor-not-allowed bg-gray-100 dark:bg-slate-800"
              )}
              placeholder="email@address.com"
              disabled={navigation.state !== "idle"}
            />
          </div>

          {showPasswordInput && (
            <div>
              <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="password">
                {t("account.shared.password")}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="************"
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                disabled={navigation.state !== "idle"}
              />
            </div>
          )}
          {/* Personal Info: End */}

          <div>
            <LoadingButton
              disabled={!registerButtonEnabled || navigation.state !== "idle"}
              className="block w-full hover:bg-black dark:bg-gray-900"
              type="submit"
            >
              {t("account.register.prompts.register.title")}
            </LoadingButton>
          </div>

          <div id="form-error-message">
            {error ? (
              <div className="flex items-center justify-center space-x-2 text-sm text-red-500 dark:text-red-300" role="alert">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <div>{error}</div>
              </div>
            ) : null}
          </div>
        </Form>
      )}

      <p className="mt-3 border-t border-gray-200 py-2 text-center text-sm text-gray-500 dark:border-gray-700">
        {t("account.register.bySigningUp")}{" "}
        <a target="_blank" href="/terms-and-conditions" className="text-theme-500 underline">
          {t("account.register.termsAndConditions")}
        </a>{" "}
        {t("account.register.andOur")}{" "}
        <a target="_blank" href="/privacy-policy" className="text-theme-500 underline">
          {t("account.register.privacyPolicy")}
        </a>
        .
      </p>
    </div>
  );
};
