import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useTypedLoaderData } from "remix-typedjson";
import PermissionForm from "~/components/core/roles/PermissionForm";
import SlideOverFormLayout from "~/components/ui/slideOvers/SlideOverFormLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import { useAdminData } from "~/utils/data/useAdminData";
import { createAdminLog } from "~/utils/db/logs.db.server";
import { deletePermission, getPermission, PermissionWithRoles, updatePermission } from "~/utils/db/permissions/permissions.db.server";
import { setPermissionRoles } from "~/utils/db/permissions/rolePermissions.db.server";
import { getAllRoles, RoleWithPermissions } from "~/utils/db/permissions/roles.db.server";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  title: string;
  item: PermissionWithRoles;
  roles: RoleWithPermissions[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);

  const item = await getPermission(params.id ?? "");
  if (!item) {
    throw redirect("/admin/accounts/roles-and-permissions/permissions");
  }
  const roles = await getAllRoles();
  const data: LoaderData = {
    title: `${item.name} | ${t("models.permission.object")} | ${process.env.APP_NAME}`,
    item,
    roles,
  };
  return json(data);
};

type ActionData = {
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);

  const existing = await getPermission(params.id ?? "");
  if (!existing) {
    return redirect("/admin/accounts/roles-and-permissions/permissions");
  }

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";
  if (action === "edit") {
    await verifyUserHasPermission(request, "admin.roles.update");
    const name = form.get("name")?.toString() ?? "";
    const description = form.get("description")?.toString() ?? "";
    const type: "admin" | "app" = form.get("type")?.toString() === "admin" ? "admin" : "app";
    const roles = form.getAll("roles[]").map((f) => f.toString());
    const data = {
      name,
      description,
      type,
    };
    await updatePermission(existing.id, data);
    await setPermissionRoles(existing.id, roles);
    createAdminLog(
      request,
      "Updated",
      `${existing.name}: ${JSON.stringify({
        ...data,
        roles,
      })}`
    );
  } else if (action === "delete") {
    await verifyUserHasPermission(request, "admin.roles.delete");
    await deletePermission(existing.id);
    createAdminLog(request, "Deleted", `${existing.name}`);
  } else {
    return badRequest({ error: t("shared.invalidForm") });
  }
  return redirect("/admin/accounts/roles-and-permissions/permissions");
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminEditPermissionRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const adminData = useAdminData();
  const navigate = useNavigate();
  function goBack() {
    navigate("/admin/accounts/roles-and-permissions/permissions");
  }
  return (
    <SlideOverFormLayout title={data.item.name} description={data.item.description} onClosed={goBack}>
      <PermissionForm
        item={data.item}
        roles={data.roles}
        onCancel={goBack}
        canUpdate={getUserHasPermission(adminData, "admin.roles.update")}
        canDelete={getUserHasPermission(adminData, "admin.roles.delete")}
      />
    </SlideOverFormLayout>
  );
}
