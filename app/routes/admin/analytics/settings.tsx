import { AnalyticsSettings } from "@prisma/client";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSubmit, useTransition } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import InputCheckboxWithDescription from "~/components/ui/input/InputCheckboxWithDescription";
import InputText from "~/components/ui/input/InputText";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import SettingSection from "~/components/ui/sections/SettingSection";
import { i18nHelper } from "~/locale/i18n.utils";
import { useRootData } from "~/utils/data/useRootData";
import { db } from "~/utils/db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  settings: AnalyticsSettings;
};
export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.analytics.delete");
  let settings = await db.analyticsSettings.findFirst({});
  if (!settings) {
    settings = await db.analyticsSettings.create({ data: { public: false, ignorePages: "/admin/analytics", onlyPages: "" } });
  }
  const data: LoaderData = {
    settings,
  };
  return json(data);
};

type ActionData = {
  deleteError?: string;
  deleteSuccess?: boolean;
};
export const action: ActionFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.analytics.delete");
  const { t } = await i18nHelper(request);

  let settings = await db.analyticsSettings.findFirst({});
  if (!settings) {
    settings = await db.analyticsSettings.create({ data: { public: false, ignorePages: "/admin/analytics", onlyPages: "" } });
  }

  const form = await request.formData();
  const action = form.get("action");
  if (action === "delete-all") {
    await db.analyticsUniqueVisitor.deleteMany({});
    await db.analyticsPageView.deleteMany({});
    await db.analyticsEvent.deleteMany({});
    return json({
      deleteSuccess: true,
    });
  }
  if (action === "set-settings") {
    const isPublicStr = form.get("public");
    const isPublic = isPublicStr === "true" || isPublicStr === "on";
    const ignorePage = form.get("ignore-page")?.toString() ?? "";
    let ignorePages = settings.ignorePages.split(",");
    if (ignorePage !== "" && !ignorePages.includes(ignorePage)) {
      ignorePages = [...ignorePages, ignorePage];
    }
    await db.analyticsSettings.update({
      where: { id: settings.id },
      data: {
        public: isPublic,
        ignorePages: ignorePages.join(","),
      },
    });
    return json({
      setSettingsSuccess: true,
    });
  }
  if (action === "remove-ignored-page") {
    const ignoredPage = form.get("ignored-page")?.toString() ?? "";
    let ignorePages = settings.ignorePages.split(",");
    if (ignorePages.includes(ignoredPage)) {
      ignorePages = ignorePages.filter((page) => page !== ignoredPage);
    }
    await db.analyticsSettings.update({
      where: { id: settings.id },
      data: {
        ignorePages: ignorePages.join(","),
      },
    });
    return json({
      setSettingsSuccess: true,
    });
  } else {
    return json({
      error: t("shared.invalidForm"),
    });
  }
};

export default function AdminAnalyticsOverviewRoute() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const transition = useTransition();
  const isUpdatingSettings = transition.state === "submitting" && transition.submission.formData.get("action") === "set-settings";
  const rootData = useRootData();

  const formRef = useRef<HTMLFormElement>(null);

  const [isPublic, setIsPublic] = useState(data?.settings.public);

  useEffect(() => {
    if (!isUpdatingSettings) {
      formRef.current?.reset();
    }
  }, [isUpdatingSettings]);

  function removeIgnoredPage(item: string) {
    const form = new FormData();
    form.set("action", "remove-ignored-page");
    form.set("ignored-page", item);
    submit(form, { method: "post" });
  }
  return (
    <>
      <IndexPageLayout
        replaceTitleWithTabs={true}
        tabs={[
          {
            name: t("analytics.overview"),
            routePath: "/admin/analytics/overview",
          },
          {
            name: t("analytics.uniqueVisitors"),
            routePath: "/admin/analytics/visitors",
          },
          {
            name: t("analytics.pageViews"),
            routePath: "/admin/analytics/page-views",
          },
          {
            name: t("analytics.events"),
            routePath: "/admin/analytics/events",
          },
          {
            name: t("analytics.settings"),
            routePath: "/admin/analytics/settings",
          },
        ]}
      >
        <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9 p-4">
          <SettingSection title="Preferences" description="Set your analytics preferences.">
            <Form ref={formRef} method="post">
              <input hidden readOnly name="action" value="set-settings" />
              <div className="space-y-2">
                <InputCheckboxWithDescription
                  name="public"
                  title={t("shared.public")}
                  description={
                    <div className="text-gray-600">
                      Share your stats on a public URL at{" "}
                      <a className="underline" target="_blank" rel="noreferrer" href={rootData.serverUrl + "/analytics"}>
                        {rootData.serverUrl + "/analytics"}
                      </a>
                    </div>
                  }
                  value={isPublic}
                  setValue={setIsPublic}
                />
                <div className="space-y-2">
                  <div className="font-medium text-gray-600 text-sm">Ingored pages</div>
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-3 space-y-1">
                    {data.settings.ignorePages.length === 0 && <div className="text-xs text-gray-500">There are no ignored pages.</div>}
                    {data.settings.ignorePages
                      .split(",")
                      .filter((f) => f)
                      .map((item) => {
                        return (
                          <div key={item} className="text-xs text-gray-600 border-b border-gray-50 group flex space-x-2">
                            <div>{item}</div>
                            <button type="button" className="hidden group-hover:block text-xs text-red-500 underline" onClick={() => removeIgnoredPage(item)}>
                              {t("shared.remove")}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <InputText name="ignore-page" title="Add ignored page" value="" />
                </div>
                <div className="flex items-center space-x-2 justify-end pt-3 mt-3 border-t border-gray-100">
                  <LoadingButton type="submit" disabled={isUpdatingSettings}>
                    {t("shared.save")}
                  </LoadingButton>
                </div>
              </div>
            </Form>
          </SettingSection>

          <SettingSection title={t("analytics.danger.title")} description={t("analytics.danger.description")}>
            <div>
              <div className="mt-2 max-w-xl text-sm leading-5 text-gray-500">
                <p>{t("analytics.danger.reset.description")}</p>
              </div>
              <div className="mt-5">
                <Form method="post">
                  <input hidden readOnly name="action" value="delete-all" />
                  <ButtonPrimary destructive type="submit">
                    {t("analytics.danger.reset.title")}
                  </ButtonPrimary>

                  {actionData?.deleteSuccess ? (
                    <p className="text-green-500 text-xs py-2" role="alert">
                      {t("analytics.deleted")}
                    </p>
                  ) : null}

                  {actionData?.deleteError ? (
                    <p className="text-rose-500 text-xs py-2" role="alert">
                      {actionData.deleteError}
                    </p>
                  ) : null}
                </Form>
              </div>
            </div>
          </SettingSection>
        </div>
      </IndexPageLayout>
    </>
  );
}
