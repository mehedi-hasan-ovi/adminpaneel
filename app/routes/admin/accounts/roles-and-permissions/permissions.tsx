import { ActionArgs, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getAllPermissions, PermissionWithRoles, updatePermission } from "~/utils/db/permissions/permissions.db.server";
import PermissionsTable from "~/components/core/roles/PermissionsTable";
import { useAdminData } from "~/utils/data/useAdminData";
import { getFiltersFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { getAllRolesNames } from "~/utils/db/permissions/roles.db.server";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import InputSearchWithURL from "~/components/ui/input/InputSearchWithURL";
import InputFilters from "~/components/ui/input/InputFilters";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import { useTypedLoaderData } from "remix-typedjson";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
export { serverTimingHeaders as headers };

type LoaderData = {
  title: string;
  items: PermissionWithRoles[];
  filterableProperties: FilterablePropertyDto[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "admin.roles-and-permissions.permissions");
  let { t } = await time(i18nHelper(request), "i18nHelper");

  const filterableProperties: FilterablePropertyDto[] = [
    { name: "name", title: "models.role.name" },
    { name: "description", title: "models.role.description" },
    {
      name: "roleId",
      title: "models.role.object",
      manual: true,
      options: (await time(getAllRolesNames(), "getAllRolesNames")).map((item) => {
        return {
          value: item.id,
          name: item.name,
        };
      }),
    },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const items = await time(getAllPermissions(undefined, filters), "getAllPermissions");

  const data: LoaderData = {
    title: `${t("models.permission.plural")} | ${process.env.APP_NAME}`,
    items,
    filterableProperties,
  };
  return json(data, { headers: getServerTimingHeader() });
};

type ActionData = {
  items?: PermissionWithRoles[];
};
export const action = async ({ request, params }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  if (action === "set-orders") {
    const items: { id: string; order: number }[] = form.getAll("orders[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    await Promise.all(
      items.map(async ({ id, order }) => {
        await updatePermission(id, { order: Number(order) });
      })
    );
    return json({ items: await getAllPermissions() });
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminRolesRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedLoaderData<ActionData>();
  const adminData = useAdminData();

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="flex-grow">
          <InputSearchWithURL />
        </div>
        <InputFilters filters={data.filterableProperties} />
        <ButtonPrimary to="new">
          <div className="sm:text-sm">+</div>
        </ButtonPrimary>
      </div>
      <PermissionsTable
        // canReorder={true}
        items={actionData?.items ?? data.items}
        canCreate={getUserHasPermission(adminData, "admin.roles.create")}
        canUpdate={getUserHasPermission(adminData, "admin.roles.update")}
      />
      <Outlet />
    </div>
  );
}
