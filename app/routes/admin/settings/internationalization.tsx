import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import UnderConstruction from "~/components/ui/misc/UnderConstruction";
import { i18nHelper } from "~/locale/i18n.utils";
import { useAdminData } from "~/utils/data/useAdminData";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type LoaderData = {
  title: string;
};
export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.settings.internationalization.view");
  const data: LoaderData = {
    title: `${t("settings.admin.internationalization.title")} | ${process.env.APP_NAME}`,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "update") {
    await verifyUserHasPermission(request, "admin.settings.internationalization.update");
    // TODO
    return json({});
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function AdminSettingsInternationalization() {
  const { t } = useTranslation();
  // const data = useLoaderData<LoaderData>();
  const adminData = useAdminData();

  // const [canUpdate] = useState(getUserHasPermission(adminData, "admin.settings.internationalization.update"));

  return (
    <div className="flex-1 overflow-x-auto xl:overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("settings.admin.internationalization.title")}</h1>

        <UnderConstruction title="TODO: Internationalization (Save custom translations on the database?)" />

        <Form method="post" className="divide-y-gray-200 space-y-8 divide-y">
          <input name="action" value="update" hidden readOnly />

          {JSON.stringify(adminData.i18n)}

          {/* <div className="flex justify-end pt-8">
            <LoadingButton type="submit" disabled={!getUserHasPermission(adminData, "admin.settings.internationalization.update")}>
              {t("shared.save")}
            </LoadingButton>
          </div> */}
        </Form>
      </div>
    </div>
  );
}
