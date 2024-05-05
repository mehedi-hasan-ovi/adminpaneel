import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import RolesTable from "~/components/core/roles/RolesTable";
import { getAllRolesWithUsers, RoleWithPermissionsAndUsers } from "~/utils/db/permissions/roles.db.server";
import { useAppData } from "~/utils/data/useAppData";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  title: string;
  items: RoleWithPermissionsAndUsers[];
};

export let loader: LoaderFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);

  const items = await getAllRolesWithUsers("app");

  const data: LoaderData = {
    title: `${t("models.role.plural")} | ${process.env.APP_NAME}`,
    items,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function RolesRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const appData = useAppData();

  return (
    <div>
      <RolesTable items={data.items} canUpdate={false} tenantId={appData.currentTenant.id} />
    </div>
  );
}
