import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import InputGroup from "~/components/ui/forms/InputGroup";
import InputImage from "~/components/ui/input/InputImage";
import InputText from "~/components/ui/input/InputText";
import { i18nHelper } from "~/locale/i18n.utils";
import { useAdminData } from "~/utils/data/useAdminData";
import { db } from "~/utils/db.server";
import { AppConfiguration, getAppConfiguration, getOrCreateAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { storeSupabaseFile } from "~/utils/integrations/supabaseService";
import { promiseHash } from "~/utils/promises/promiseHash";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
  appConfiguration: AppConfiguration;
};
export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.settings.general.view");
  const appConfiguration = await getAppConfiguration();
  const data: LoaderData = {
    title: `${t("settings.admin.general.title")} | ${process.env.APP_NAME}`,
    appConfiguration,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "update") {
    await verifyUserHasPermission(request, "admin.settings.general.update");
    await getOrCreateAppConfiguration();

    const { name, url, logo, logoDarkMode, icon, iconDarkMode, favicon } = {
      name: form.get("name")?.toString(),
      url: form.get("url")?.toString(),
      logo: form.get("logo")?.toString(),
      logoDarkMode: form.get("logoDarkMode")?.toString(),
      icon: form.get("icon")?.toString(),
      iconDarkMode: form.get("iconDarkMode")?.toString(),
      favicon: form.get("favicon")?.toString(),
    };

    const { storedLogo, storedLogoDarkMode, storedIcon, storedIconDarkMode, storedFavicon } = await promiseHash({
      storedLogo: logo ? storeSupabaseFile({ bucket: "branding", content: logo, id: "logo" }) : Promise.resolve(""),
      storedLogoDarkMode: logoDarkMode ? storeSupabaseFile({ bucket: "branding", content: logoDarkMode, id: "logo-dark-mode" }) : Promise.resolve(""),
      storedIcon: icon ? storeSupabaseFile({ bucket: "branding", content: icon, id: "icon" }) : Promise.resolve(""),
      storedIconDarkMode: iconDarkMode ? storeSupabaseFile({ bucket: "branding", content: iconDarkMode, id: "icon-dark-mode" }) : Promise.resolve(""),
      storedFavicon: favicon ? storeSupabaseFile({ bucket: "branding", content: favicon, id: "favicon" }) : Promise.resolve(""),
    });

    const settings = await db.appConfiguration.updateMany({
      data: {
        name,
        url,
        brandingLogo: storedLogo,
        brandingLogoDarkMode: storedLogoDarkMode,
        brandingIcon: storedIcon,
        brandingIconDarkMode: storedIconDarkMode,
        brandingFavicon: storedFavicon,
      },
    });
    return json({ settings });
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function AdminSettingsGeneral() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  const adminData = useAdminData();

  const [logoLight, setLogoLight] = useState(data.appConfiguration.branding.logo ?? "");
  const [logoDarkMode, setLogoDarkMode] = useState(data.appConfiguration.branding.logoDarkMode ?? "");
  const [iconLight, setIconLight] = useState(data.appConfiguration.branding.icon ?? "");
  const [iconDarkMode, setIconDarkMode] = useState(data.appConfiguration.branding.iconDarkMode ?? "");
  const [favicon, setFavicon] = useState(data.appConfiguration.branding.favicon ?? "");

  const [canUpdate] = useState(getUserHasPermission(adminData, "admin.settings.general.update"));
  return (
    <div className="flex-1 overflow-x-auto xl:overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("settings.admin.general.title")}</h1>

        <Form method="post" className="mt-6 space-y-8">
          <input name="action" value="update" hidden readOnly />
          <InputGroup title="General">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
              <div className="sm:col-span-3">
                <InputText name="name" title="Application name" value={data.appConfiguration.app.name ?? ""} disabled={!canUpdate} required />
              </div>
              <div className="sm:col-span-3">
                <InputText name="url" title="URL" value={data.appConfiguration.app.url ?? ""} disabled={!canUpdate} required />
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Branding">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
              <div className="sm:col-span-3">
                <InputImage name="logo" title="Logo (Light Mode)" value={logoLight} setValue={setLogoLight} disabled={!canUpdate} />
              </div>
              <div className="sm:col-span-3">
                <InputImage name="logoDarkMode" title="Logo (Dark Mode)" value={logoDarkMode} setValue={setLogoDarkMode} disabled={!canUpdate} darkMode />
              </div>
              {/* <div className="sm:col-span-6">
                <PreviewLogo />
              </div> */}
              <div className="sm:col-span-3">
                <InputImage name="icon" title="Icon" value={iconLight} setValue={setIconLight} disabled={!canUpdate} />
              </div>
              <div className="sm:col-span-3">
                <InputImage name="iconDarkMode" title="Icon (Dark Mode)" value={iconDarkMode} setValue={setIconDarkMode} disabled={!canUpdate} darkMode />
              </div>
              {/* <div className="sm:col-span-6">
                <PreviewIcon />
              </div> */}
              <div className="sm:col-span-6">
                <InputImage name="favicon" title="Favicon" value={favicon} setValue={setFavicon} disabled={!canUpdate} />
              </div>
              {/* <div className="sm:col-span-6">
                <PreviewFavicon />
              </div> */}
            </div>
          </InputGroup>

          <div className="flex justify-end">
            <LoadingButton type="submit" disabled={!getUserHasPermission(adminData, "admin.settings.general.update")}>
              {t("shared.save")}
            </LoadingButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
