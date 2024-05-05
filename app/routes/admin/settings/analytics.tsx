import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import InputCheckboxWithDescription from "~/components/ui/input/InputCheckboxWithDescription";
import InputText from "~/components/ui/input/InputText";
import { i18nHelper } from "~/locale/i18n.utils";
import { useAdminData } from "~/utils/data/useAdminData";
import { db } from "~/utils/db.server";
import { AppConfiguration, getAppConfiguration, getOrCreateAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  appConfiguration: AppConfiguration;
};
export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.settings.analytics.view");
  const appConfiguration = await getAppConfiguration();
  const data: LoaderData = {
    title: `${t("settings.admin.analytics.title")} | ${process.env.APP_NAME}`,
    appConfiguration,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "update") {
    await verifyUserHasPermission(request, "admin.settings.analytics.update");
    await getOrCreateAppConfiguration();
    await db.appConfiguration.updateMany({
      data: {
        analyticsEnabled: Boolean(form.get("enabled")),
        analyticsSimpleAnalytics: Boolean(form.get("simpleAnalytics")),
        analyticsPlausibleAnalytics: Boolean(form.get("plausibleAnalytics")),
        analyticsGoogleAnalyticsTrackingId: form.get("googleAnalyticsTrackingId")?.toString(),
      },
    });
    return json({});
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function AdminSettingsAnalytics() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  const adminData = useAdminData();

  const [enabled, setEnabled] = useState(data.appConfiguration.analytics.enabled);
  const [simpleAnalytics, setSimpleAnalytics] = useState(data.appConfiguration.analytics.simpleAnalytics);
  const [plausibleAnalytics, setPlausibleAnalytics] = useState(data.appConfiguration.analytics.plausibleAnalytics);
  const [googleAnalyticsTrackingId, setGoogleAnalyticsTrackingId] = useState(data.appConfiguration.analytics.googleAnalyticsTrackingId ?? "");

  const [canUpdate] = useState(getUserHasPermission(adminData, "admin.settings.analytics.update"));

  return (
    <div className="flex-1 overflow-x-auto xl:overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>

        <Form method="post" className="divide-y-gray-200 mt-6 space-y-8 divide-y">
          <input name="action" value="update" hidden readOnly />
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-6">
              <InputCheckboxWithDescription
                name="enabled"
                value={enabled}
                setValue={setEnabled}
                title="Enabled"
                description="Built-in analytics for page views and events"
                disabled={!canUpdate}
              />

              <InputCheckboxWithDescription
                name="simpleAnalytics"
                value={simpleAnalytics}
                setValue={setSimpleAnalytics}
                title="SimpleAnalytics enabled"
                description={
                  <a href="https://simpleanalytics.com/" target="_blank" rel="noreferrer">
                    Click here to learn more.
                  </a>
                }
                disabled={!canUpdate}
              />

              <InputCheckboxWithDescription
                name="plausibleAnalytics"
                value={plausibleAnalytics}
                setValue={setPlausibleAnalytics}
                title="PlausibleAnalytics enabled"
                description={
                  <a href="https://plausible.io/" target="_blank" rel="noreferrer">
                    Click here to learn more.
                  </a>
                }
                disabled={!canUpdate}
              />

              <InputText
                type="password"
                name="googleAnalyticsTrackingId"
                value={googleAnalyticsTrackingId}
                setValue={setGoogleAnalyticsTrackingId}
                title="Google Analytics Tracking ID"
                placeholder="Example: UA-123456789-1"
                disabled={!canUpdate}
              />
            </div>
          </div>

          <div className="flex justify-end pt-8">
            <LoadingButton disabled={!canUpdate} type="submit">
              {t("shared.save")}
            </LoadingButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
