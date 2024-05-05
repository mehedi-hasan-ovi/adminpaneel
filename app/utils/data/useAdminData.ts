import { redirect } from "@remix-run/node";
import { useMatches } from "@remix-run/react";
import { getUserInfo } from "../session.server";
import { getUser } from "../db/users.db.server";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "../app/UrlUtils";
import { getAllEntities } from "../db/entities/entities.db.server";
import { getMyTenants } from "../db/tenants.db.server";
import { getPermissionsByUser, getUserRoleInAdmin } from "../db/permissions/userRoles.db.server";
import { AppOrAdminData } from "./useAppOrAdminData";
import { getAllRolesWithoutPermissions } from "../db/permissions/roles.db.server";
import { DefaultAdminRoles } from "~/application/dtos/shared/DefaultAdminRoles";
import { getMyGroups } from "../db/permissions/groups.db.server";
import OnboardingService from "~/modules/onboarding/services/OnboardingService";
import { DefaultPermission } from "~/application/dtos/shared/DefaultPermissions";
import { TimeFunction } from "~/modules/metrics/utils/MetricTracker";
import { promiseHash } from "../promises/promiseHash";
import { getAllEntityGroups } from "../db/entities/entityGroups.db.server";
import { getAllTenantTypes } from "../db/tenants/tenantTypes.db.server";
import EntitiesSingleton from "~/modules/rows/repositories/EntitiesSingleton";

export type AdminLoaderData = AppOrAdminData;

export function useAdminData(): AdminLoaderData {
  const paths: string[] = ["routes/admin"];
  const adminData = (useMatches().find((f) => paths.includes(f.id.toLowerCase()))?.data ?? {}) as AdminLoaderData;
  EntitiesSingleton.getInstance().setEntities(adminData.entities);
  return adminData;
}

export async function loadAdminData({ request }: { request: Request }, time: TimeFunction) {
  const { translations } = await time(i18nHelper(request), "i18nHelper");
  const userInfo = await time(getUserInfo(request), "getUserInfo");
  const url = new URL(request.url);
  if (UrlUtils.stripTrailingSlash(url.pathname) === `/admin`) {
    throw redirect(`/admin/dashboard`);
  }
  const user = await time(getUser(userInfo?.userId), "getUser");
  const redirectTo = url.pathname + url.search;
  if (!userInfo || !user) {
    let searchParams = new URLSearchParams([["redirect", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  if (!user.admin) {
    throw redirect("/401");
  }

  const myTenants = await time(getMyTenants(user.id), "getMyTenants");

  const { allPermissions, superAdminRole, entities, entityGroups, allRoles, myGroups, onboardingSession } = await time(
    promiseHash({
      allPermissions: getPermissionsByUser(userInfo.userId, null),
      superAdminRole: getUserRoleInAdmin(userInfo.userId, DefaultAdminRoles.SuperAdmin),
      entities: getAllEntities({ tenantId: null }),
      entityGroups: getAllEntityGroups(),
      allRoles: getAllRolesWithoutPermissions("admin"),
      myGroups: getMyGroups(user.id, null),
      onboardingSession: OnboardingService.getUserActiveOnboarding({ userId: user.id, tenantId: null }),
    }),
    "loadAdminData.getDetails"
  );
  const data: AdminLoaderData = {
    i18n: translations,
    user,
    myTenants,
    entities,
    entityGroups,
    // roles,
    allRoles,
    permissions: allPermissions.map((f) => f as DefaultPermission),
    isSuperUser: !!superAdminRole,
    isSuperAdmin: !!superAdminRole,
    myGroups,
    lng: user?.locale ?? userInfo.lng,
    onboardingSession,
    tenantTypes: await getAllTenantTypes(),
  };
  return data;
}
