import Logo from "~/components/brand/Logo";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import UserUtils from "~/utils/app/UserUtils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "@remix-run/react";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUserByEmail, updateUserPassword } from "~/utils/db/users.db.server";
import bcrypt from "bcryptjs";
import InfoBanner from "~/components/ui/banners/InfoBanner";
import ExclamationTriangleIcon from "~/components/ui/icons/ExclamationTriangleIcon";
import { createUserPasswordUpdatedEvent } from "~/utils/services/events/usersEventsService";

export let loader: LoaderFunction = async ({ request }) => {
  let { t, translations } = await i18nHelper(request);
  return json({
    title: `${t("account.reset.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
  });
};

type ActionData = {
  success?: string;
  error?: string;
  fields: {
    email: string;
    verifyToken: string;
  };
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
const success = (data: ActionData) => json(data, { status: 200 });
export const action: ActionFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);

  const form = await request.formData();
  const email = form.get("email")?.toString() ?? "";
  const verifyToken = form.get("verify-token")?.toString() ?? "";
  const password = form.get("password")?.toString() ?? "";
  const passwordConfirm = form.get("password-confirm")?.toString() ?? "";

  const fields = {
    email,
    verifyToken,
  };
  if (!email) {
    return badRequest({ error: "Email required", fields });
  }
  const passwordError = UserUtils.validatePasswords({ t, password, passwordConfirm });
  if (passwordError) {
    return badRequest({
      error: passwordError,
      fields,
    });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return badRequest({
      error: t("api.errors.userNotRegistered"),
      fields,
    });
  }

  if (!user.verifyToken || !verifyToken || user.verifyToken !== verifyToken) {
    return badRequest({
      error: "Invalid token, reset your password first",
      fields,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPassword({ passwordHash }, user.id);
  await createUserPasswordUpdatedEvent(null, { user: { id: user.id, email: user.email } });

  return success({ success: "Click here to log in.", fields });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function ResetRoute() {
  const { t } = useTranslation();
  const actionData = useActionData<ActionData>();

  const search = useLocation().search;
  const [email] = useState(actionData?.fields.email ?? new URLSearchParams(search).get("e") ?? "");
  const [verifyToken] = useState(actionData?.fields.email ?? new URLSearchParams(search).get("t") ?? "");

  const [, setSearchParams] = useSearchParams();
  const [actionResult, setActionResult] = useState<{ error?: string; success?: string }>();
  useEffect(() => {
    if (actionData) {
      setActionResult(actionData);
    }
    if (actionData?.error) {
      setSearchParams({ e: actionData.fields.email, t: actionData.fields.verifyToken });
    }
  }, [actionData, setSearchParams]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-5">
          <Logo className="mx-auto h-9" />
          <div className="flex flex-col items-center">
            <div className="text-left text-xl font-extrabold">{t("account.newPassword.title")}</div>
            <div className="mt-1 text-left text-sm">
              <Link to="/login" className="text-theme-500  hover:text-theme-600 hover:underline">
                {t("account.register.clickHereToLogin")}.
              </Link>
            </div>
          </div>

          <div className="mx-auto flex flex-col items-center space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <Form method="post" className="w-full space-y-3">
              <input type="hidden" name="verify-token" defaultValue={verifyToken} required hidden readOnly />
              <div>
                <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="email">
                  {t("account.shared.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="relative mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder="email@address.com"
                  readOnly
                  defaultValue={email}
                />
              </div>
              <div>
                <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="password">
                  {t("account.shared.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder="************"
                  readOnly={!email}
                />
              </div>
              <div>
                <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="password">
                  {t("account.register.confirmPassword")}
                </label>
                <input
                  name="password-confirm"
                  type="password"
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder="************"
                  readOnly={!email}
                />
              </div>
              <div className="flex items-center justify-end">
                <LoadingButton disabled={!email} className="block w-full hover:bg-black dark:bg-gray-900" type="submit">
                  {t("account.newPassword.button")}
                </LoadingButton>
              </div>
              <div id="form-error-message">
                {actionResult?.error ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-red-500 dark:text-red-300" role="alert">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <div>{actionResult.error}</div>
                  </div>
                ) : null}
              </div>
            </Form>
          </div>

          {actionResult?.success && (
            <InfoBanner title={t("account.reset.resetSuccess")} text={""}>
              <Link to="/login" className="text-theme-600 hover:text-theme-700 hover:underline dark:text-theme-400 dark:hover:text-theme-500">
                {actionResult.success}
              </Link>
            </InfoBanner>
          )}
        </div>
      </div>
    </div>
  );
}
