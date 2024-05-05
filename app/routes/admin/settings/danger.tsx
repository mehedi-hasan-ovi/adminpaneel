import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ActionResultModal, { ActionResultDto } from "~/components/ui/modals/ActionResultModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { db } from "~/utils/db.server";
import { AppConfiguration, getAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  appConfiguration: AppConfiguration;
};
export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.settings.danger.reset");
  const appConfiguration = await getAppConfiguration();
  const data: LoaderData = {
    title: `${t("settings.admin.danger.title")} | ${process.env.APP_NAME}`,
    appConfiguration,
  };
  return json(data);
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "delete") {
    await verifyUserHasPermission(request, "admin.settings.danger.reset");
    await db.appConfiguration.deleteMany({ where: {} });
    return json({ success: "Configuration reset successfully" });
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function AdminSettingsDanger() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const [actionResult, setActionResult] = useState<ActionResultDto>();
  useEffect(() => {
    if (actionData?.error) {
      setActionResult({ error: { description: actionData.error } });
    } else if (actionData?.success) {
      setActionResult({ success: { description: actionData.success } });
    }
  }, [actionData]);
  return (
    <div className="flex-1 overflow-x-auto xl:overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("settings.admin.danger.title")}</h1>

        <Form method="post" className="divide-y-gray-200 mt-6 space-y-8 divide-y">
          <input name="action" value="delete" hidden readOnly />
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-6">
              <h2 className="text-xl font-medium text-gray-900">Reset</h2>
              <p className="mt-1 text-sm text-gray-500">Go back to the initial application configuration.</p>
            </div>
            <div className="sm:col-span-6">
              <h2 className="font-medium text-gray-900">Current configuration</h2>
              <div className="prose mt-1">
                <pre>{JSON.stringify(data.appConfiguration, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-8">
            <ButtonPrimary destructive type="submit">
              {t("settings.reset")}
            </ButtonPrimary>
          </div>
        </Form>
      </div>
      <ActionResultModal actionResult={actionResult} />
    </div>
  );
}
