import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getAllRoles, getRole, RoleWithPermissions } from "~/utils/db/permissions/roles.db.server";
import { adminGetAllTenantUsers, getUser, UserWithDetails, UserWithRoles } from "~/utils/db/users.db.server";
import UserRolesTable from "~/components/core/roles/UserRolesTable";
import { useEffect, useState } from "react";
import InputSearch from "~/components/ui/input/InputSearch";
import { createUserRole, deleteUserRole } from "~/utils/db/permissions/userRoles.db.server";
import { getTenant } from "~/utils/db/tenants.db.server";
import { createAdminLog } from "~/utils/db/logs.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { useAppData } from "~/utils/data/useAppData";
import { createRoleAssignedEvent, createRoleUnassignedEvent } from "~/utils/services/events/rolesEventsService";
import { getUserInfo } from "~/utils/session.server";
import { useTypedLoaderData } from "remix-typedjson";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  title: string;
  items: UserWithRoles[];
  roles: RoleWithPermissions[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);

  const tenantUsers = await adminGetAllTenantUsers(tenantId);
  const roles = await getAllRoles("app");

  const items: UserWithDetails[] = [];
  tenantUsers.forEach((user) => {
    if (!items.find((f) => f.id === user.id)) {
      items.push(user);
    }
  });

  const data: LoaderData = {
    title: `${t("models.role.adminRoles")} | ${process.env.APP_NAME}`,
    items,
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
  const tenantId = await getTenantIdFromUrl(params);
  const userInfo = await getUserInfo(request);
  const fromUser = await getUser(userInfo.userId);
  if (!fromUser) {
    return badRequest({ error: "Invalid user" });
  }

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";
  if (action === "edit") {
    const userId = form.get("user-id")?.toString() ?? "";
    const roleId = form.get("role-id")?.toString() ?? "";
    const add = form.get("add") === "true";

    const tenant = await getTenant(tenantId);
    const user = await getUser(userId);
    const role = await getRole(roleId);

    if (add) {
      await createUserRole(userId, roleId, tenantId);
      if (fromUser && user && role) {
        await createRoleAssignedEvent(tenantId, {
          fromUser: { id: fromUser.id, email: fromUser.email },
          toUser: { id: user.id, email: user.email },
          role: { id: role.id, name: role.name, description: role.description },
        });
      }
      createAdminLog(request, "Created", `[${tenant?.name}] ${user?.email} - ${role?.name}}`);
    } else {
      if (fromUser && user && role) {
        await createRoleUnassignedEvent(tenantId, {
          fromUser: { id: fromUser.id, email: fromUser.email },
          toUser: { id: user.id, email: user.email },
          role: { id: role.id, name: role.name, description: role.description },
        });
      }
      await deleteUserRole(userId, roleId, tenantId);
      createAdminLog(request, "Deleted", `[${tenant?.name}] ${user?.email} - ${role?.name}}`);
    }

    return json({});
  } else {
    return badRequest({ error: t("shared.invalidForm") });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminAccountUsersFromTenant() {
  const data = useTypedLoaderData<LoaderData>();
  const appData = useAppData();
  const [items, setItems] = useState(data.items);
  const submit = useSubmit();

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setItems(data.items);
  }, [data]);

  const filteredItems = () => {
    if (!items) {
      return [];
    }
    return items.filter(
      (f) =>
        f.email?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.firstName?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.lastName?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.roles.find(
          (f) => f.role.name.toUpperCase().includes(searchInput.toUpperCase()) || f.role.description.toUpperCase().includes(searchInput.toUpperCase())
        )
    );
  };

  function onChange(item: UserWithRoles, role: RoleWithPermissions, add: any) {
    const form = new FormData();
    form.set("action", "edit");
    form.set("user-id", item.id);
    form.set("role-id", role.id);
    form.set("add", add ? "true" : "false");
    submit(form, {
      method: "post",
    });
  }

  return (
    <div className="space-y-2">
      <InputSearch value={searchInput} setValue={setSearchInput} />

      <UserRolesTable
        items={filteredItems()}
        roles={data.roles}
        onChange={onChange}
        tenantId={appData.currentTenant.id}
        disabled={!getUserHasPermission(appData, "app.settings.roles.set")}
      />
    </div>
  );
}
