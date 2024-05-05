import { Entity, Prisma } from "@prisma/client";
import { redirect } from "@remix-run/node";
import { RowPermissionsDto } from "~/application/dtos/entities/RowPermissionsDto";
import { RowAccess, RowAccessTypes } from "~/application/enums/entities/RowAccess";
import { AppOrAdminData } from "../data/useAppOrAdminData";
import { RowWithDetails } from "../db/entities/rows.db.server";
import { getMyGroups } from "../db/permissions/groups.db.server";
import { RowPermissionsWithDetails } from "../db/permissions/rowPermissions.db.server";
import { getPermissionName } from "../db/permissions/permissions.db.server";
import { countUserPermission, findUserRolesByIds, findPermissionByUser, getUserRoles } from "../db/permissions/userRoles.db.server";
import { getUserInfo } from "../session.server";
import { DefaultPermission } from "~/application/dtos/shared/DefaultPermissions";
import { getMyTenants } from "../db/tenants.db.server";
import { getTenantRelationshipsFromByUserTenants } from "../db/tenants/tenantRelationships.db.server";

export async function getEntityPermissions(entity: Entity): Promise<{ name: string; description: string }[]> {
  return [
    { name: getEntityPermission(entity, "view"), description: `View ${entity.name} page` },
    { name: getEntityPermission(entity, "read"), description: `View ${entity.name} records` },
    { name: getEntityPermission(entity, "create"), description: `Create ${entity.name}` },
    { name: getEntityPermission(entity, "update"), description: `Update ${entity.name}` },
    { name: getEntityPermission(entity, "delete"), description: `Delete ${entity.name}` },
  ];
}

export function getEntityPermission(entity: { name: string }, permission: "view" | "read" | "create" | "update" | "delete"): DefaultPermission {
  return `entity.${entity.name}.${permission}` as DefaultPermission;
}

export async function getUserPermission({ userId, permissionName, tenantId }: { userId: string; permissionName: string; tenantId?: string | null }) {
  const permission = await getPermissionName(permissionName);
  if (!permission) {
    return { permission, userPermission: undefined };
  }
  // const userRoles = await getUserRoles(userId ?? undefined, tenantId ?? null);
  // let userPermission: Permission | undefined = undefined;
  // userRoles.forEach((userRole) => {
  //   userRole.role.permissions.forEach((rolePermission) => {
  //     if (rolePermission.permission.name === permissionName) {
  //       userPermission = rolePermission.permission;
  //     }
  //   });
  // });
  const userPermission = await findPermissionByUser(permissionName, userId, tenantId);
  return { permission, userPermission };
}

export async function verifyUserHasPermission(request: Request, permissionName: DefaultPermission, tenantId: string | null = null) {
  const userInfo = await getUserInfo(request);
  if (!userInfo.userId) {
    throw Error("Unauthorized");
  }
  const permission = await getPermissionName(permissionName);
  if (permission) {
    const userPermission = (await countUserPermission(userInfo.userId, tenantId, permissionName)) > 0;
    if (!userPermission) {
      if (tenantId) {
        // TODO: IMPROVE
        const myTenants = await getMyTenants(userInfo.userId);
        const childTenants = await getTenantRelationshipsFromByUserTenants(myTenants.map((f) => f.id));
        const currentTenantAsChild = childTenants.find((f) => f.toTenantId === tenantId);
        const existingPermission = currentTenantAsChild?.tenantTypeRelationship.permissions.find((f) => f.name === permissionName);
        if (existingPermission) {
          return true;
        }
        // TODO: END IMPROVE
        throw redirect(`/unauthorized/${permissionName}/${tenantId}/?redirect=${new URL(request.url).pathname}`);
      } else {
        throw redirect(`/unauthorized/${permissionName}?redirect=${new URL(request.url).pathname}`);
      }
    }
  }
  return true;
}

export async function getUserRowPermission(row: RowWithDetails, tenantId?: string | null, userId?: string): Promise<RowPermissionsDto> {
  const accessLevels: RowAccess[] = ["none"];

  let isOwner = false;
  if (tenantId === undefined && userId === undefined) {
    accessLevels.push("view");
  } else {
    isOwner = !!userId && userId === row.createdByUserId;
    if (tenantId) {
      const existing = row.permissions.find((f) => f.tenantId);
      if (existing) {
        accessLevels.push(existing.access as RowAccess);
      }
    } else if (userId) {
      if (row.createdByUserId === userId || row.createdByUserId === null) {
        accessLevels.push("delete");
      }
      const existing = row.permissions.find((f) => f.userId === userId);
      if (existing) {
        accessLevels.push(existing.access as RowAccess);
      }
    }
    if (tenantId !== undefined && userId) {
      const inRoles = row.permissions
        .filter((f) => f.roleId)
        .map((f) => f.roleId)
        .map((f) => f as string);
      if (inRoles.length > 0) {
        const userRoles = await findUserRolesByIds(userId, tenantId, inRoles);
        userRoles.forEach((userRole) => {
          const existing = row.permissions.find((f) => f.roleId === userRole.roleId);
          if (existing) {
            accessLevels.push(existing.access as RowAccess);
          }
        });
      }

      const inGroups = row.permissions
        .filter((f) => f.groupId)
        .map((f) => f.groupId)
        .map((f) => f as string);
      if (inGroups.length > 0) {
        const userGroups = await getMyGroups(userId, tenantId);
        userGroups.forEach((userGroup) => {
          const existing = row.permissions.find((f) => f.groupId === userGroup.id);
          if (existing) {
            accessLevels.push(existing.access as RowAccess);
          }
        });
      }
    }
  }

  let access: RowAccess | undefined = undefined;
  for (let idx = RowAccessTypes.length - 1; idx >= 0; idx--) {
    const accessType = RowAccessTypes[idx];
    if (accessLevels.includes(accessType)) {
      access = accessType;
      break;
    }
  }

  const rowPermissions: RowPermissionsDto = {
    canRead: isOwner || (access && access !== "none"),
    canComment: isOwner || access === "comment" || access === "edit" || access === "delete",
    canUpdate: isOwner || access === "edit" || access === "delete",
    canDelete: isOwner || access === "delete",
    isOwner,
  };
  return rowPermissions;
}

export type RowPermissionsFilter = Prisma.RowWhereInput | {};
export async function getRowPermissionsCondition({ tenantId, userId }: { tenantId?: string | null; userId?: string }) {
  const OR_CONDITIONS: Prisma.RowWhereInput[] = [];
  if (tenantId) {
    OR_CONDITIONS.push(...[{ permissions: { some: { tenantId } } }]);
    if (userId) {
      OR_CONDITIONS.push(...[{ createdByUserId: userId }, { permissions: { some: { userId } } }]);
    }
  } else {
    if (userId) {
      OR_CONDITIONS.push(...[{ createdByUserId: null }, { createdByUserId: userId }, { permissions: { some: { userId } } }]);
    }
  }
  if (tenantId !== undefined && userId) {
    const userRoles = await getUserRoles(userId, tenantId);
    userRoles.forEach((userRole) => {
      OR_CONDITIONS.push(...[{ permissions: { some: { roleId: userRole.roleId } } }]);
    });

    const userGroups = await getMyGroups(userId, tenantId);
    userGroups.forEach((userGroup) => {
      OR_CONDITIONS.push(...[{ permissions: { some: { groupId: userGroup.id } } }]);
    });
  }
  return {
    OR: OR_CONDITIONS,
  };
}

export function getUserHasPermission(appOrAdminData: AppOrAdminData, permission: DefaultPermission) {
  if (appOrAdminData?.permissions === undefined) {
    return true;
  }
  if (appOrAdminData.isSuperAdmin) {
    return true;
  }
  return appOrAdminData.permissions.includes(permission);
}

export function getRowPermissionsObjects(permissions: RowPermissionsWithDetails[]) {
  return permissions
    .filter((f) => f !== null)
    .map((item) => {
      return {
        tenant: item.tenant ? { id: item.tenant.id, name: item.tenant.name } : null,
        role: item.role ? { id: item.role.id, name: item.role.name } : null,
        group: item.group ? { id: item.group.id, name: item.group.name } : null,
        user: item.user ? { id: item.user.id, email: item.user.email } : null,
      };
    })
    .filter((f) => f !== null);
}

export function getRowPermissionsDescription(
  permissions: {
    tenant: { id: string; name: string } | null;
    role: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
    user: { id: string; email: string } | null;
  }[]
) {
  return permissions
    .filter((f) => f !== null)
    .map((item) => {
      if (item.tenant) {
        return `Account '${item.tenant.name}'`;
      } else if (item.role) {
        return `Role '${item.role.name}'`;
      } else if (item.group) {
        return `Group '${item.group.name}'`;
      } else if (item.user) {
        return `User '${item.user.email}'`;
      }
      return "";
    })
    .filter((f) => f !== null);
}
