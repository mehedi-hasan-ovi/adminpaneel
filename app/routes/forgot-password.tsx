import Logo from "~/components/brand/Logo";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import crypto from "crypto";
import { getUserByEmail, updateUserVerifyToken } from "~/utils/db/users.db.server";
import { i18nHelper } from "~/locale/i18n.utils";
import { sendEmail } from "~/utils/email.server";
import SuccessModal, { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { baseURL } from "~/utils/url.server";
import ExclamationTriangleIcon from "~/components/ui/icons/ExclamationTriangleIcon";
import InfoBanner from "~/components/ui/banners/InfoBanner";

export let loader: LoaderFunction = async ({ request }) => {
  let { t, translations } = await i18nHelper(request);
  return json({
    title: `${t("account.forgot.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
  });
};

type ActionData = {
  success?: string;
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);

  const form = await request.formData();
  const email = form.get("email")?.toString();

  if (!email) {
    return badRequest({
      error: "Email required",
    });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return badRequest({
      error: t("api.errors.userNotRegistered"),
    });
  }

  var verifyToken = crypto.randomBytes(20).toString("hex");
  await updateUserVerifyToken({ verifyToken }, user.id);
  await sendEmail(email, "password-reset", {
    action_url: new URL(baseURL + `/reset?e=${email}&t=${verifyToken}`),
    name: user.firstName,
  });

  return json({
    success: "Email sent",
  });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function ForgotPasswordRoute() {
  const { t } = useTranslation();
  const actionData = useActionData<ActionData>();

  const errorModal = useRef<RefErrorModal>(null);
  const successModal = useRef<RefSuccessModal>(null);

  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData.error);
    }
    if (actionData?.success) {
      setEmailSent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-5">
          <Logo className="mx-auto h-9" />
          <div className="flex flex-col items-center">
            <div className="text-left text-xl font-extrabold">{t("account.forgot.title")}</div>
            <div className="mt-1 text-center text-sm">
              <Link to="/login" className="text-theme-600 hover:text-theme-700 hover:underline dark:text-theme-400 dark:hover:text-theme-500">
                {t("account.register.clickHereToLogin")}.
              </Link>
            </div>
          </div>

          <div className="mx-auto flex flex-col items-center space-y-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <Form method="post" className="w-full space-y-3">
              {/* <div className="text-left font-medium">{t("account.reset.headline")}</div> */}
              <div>
                <label className="flex justify-between space-x-2 text-xs font-medium text-gray-700 dark:text-gray-400" htmlFor="email">
                  {t("account.shared.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                  placeholder="email@address.com"
                  required
                />
              </div>
              <div className="flex items-center justify-end">
                <LoadingButton className="block w-full hover:bg-black dark:bg-gray-900" type="submit">
                  {t("account.reset.button")}
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
          </div>

          {emailSent && <InfoBanner title={t("account.reset.resetSuccess")} text={t("account.reset.emailSent")} />}
        </div>
      </div>

      <SuccessModal ref={successModal} />
      <ErrorModal ref={errorModal} />
    </div>
  );
}
