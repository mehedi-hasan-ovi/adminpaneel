import { redirect } from "@remix-run/node";
import { useMatches } from "@remix-run/react";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { getUserInfo } from "../session.server";
import { getLinkedAccountsCount } from "../db/linkedAccounts.db.server";
import { LinkedAccountStatus } from "~/application/enums/tenants/LinkedAccountStatus";
import { getMyTenants, getTenantSimple, getTenantUserType, TenantSimple } from "../db/tenants.db.server";
import { getUser } from "../db/users.db.server";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "../app/UrlUtils";
import { getTenantIdFromUrl } from "../services/urlService";
import { TenantSubscriptionWithDetails } from "../db/tenantSubscriptions.db.server";
import { getAllEntities } from "../db/entities/entities.db.server";
import { getPermissionsByUser, getUserRoleInAdmin, getUserRoleInTenant } from "../db/permissions/userRoles.db.server";
import { getMyGroups } from "../db/permissions/groups.db.server";
import { getAllRolesWithoutPermissions } from "../db/permissions/roles.db.server";
import { DefaultAppRoles } from "~/application/dtos/shared/DefaultAppRoles";
import { AppOrAdminData } from "./useAppOrAdminData";
import { DefaultAdminRoles } from "~/application/dtos/shared/DefaultAdminRoles";
import { getActiveTenantSubscriptions } from "../services/subscriptionService";
import { DefaultEntityTypes } from "~/application/dtos/shared/DefaultEntityTypes";
import OnboardingService from "~/modules/onboarding/services/OnboardingService";
import { DefaultPermission } from "~/application/dtos/shared/DefaultPermissions";
import { promiseHash } from "../promises/promiseHash";
import { TimeFunction } from "~/modules/metrics/utils/MetricTracker";
import { Params } from "@remix-run/router";
import { EntityGroupWithDetails, getAllEntityGroups } from "../db/entities/entityGroups.db.server";
import { getAllTenantTypes } from "../db/tenants/tenantTypes.db.server";
import { TenantEntitiesApi } from "../api/TenantEntitiesApi";
import { getTenantRelationshipsFromByUserTenants, TenantRelationshipWithDetails } from "../db/tenants/tenantRelationships.db.server";
import EntitiesSingleton from "~/modules/rows/repositories/EntitiesSingleton";

export type AppLoaderData = AppOrAdminData & {
  currentTenant: TenantSimple;
  mySubscription: TenantSubscriptionWithDetails | null;
  currentRole: TenantUserType;
  pendingInvitations: number;
  childTenants: TenantRelationshipWithDetails[];
};

export function useAppData(): AppLoaderData {
  const paths: string[] = ["routes/app.$tenant", "routes/app"];
  const appData = (useMatches().find((f) => paths.includes(f.id.toLowerCase()))?.data ?? {}) as AppLoaderData;
  EntitiesSingleton.getInstance().setEntities(appData.entities);
  return appData;
}

export async function loadAppData({ request, params }: { request: Request; params: Params }, time: TimeFunction) {
  const { tenantId, userInfo, i18n } = await time(
    promiseHash({
      tenantId: getTenantIdFromUrl(params),
      userInfo: getUserInfo(request),
      i18n: i18nHelper(request),
    }),
    "loadAppData.session"
  );

  const url = new URL(request.url);
  if (UrlUtils.stripTrailingSlash(url.pathname) === UrlUtils.stripTrailingSlash(UrlUtils.currentTenantUrl(params))) {
    throw redirect(UrlUtils.currentTenantUrl(params, "dashboard"));
  }
  const { user, currentTenant } = await time(
    promiseHash({
      user: getUser(userInfo?.userId),
      currentTenant: getTenantSimple(tenantId),
    }),
    "loadAppData.getUserAndTenant"
  );

  const redirectTo = url.pathname + url.search;
  if (!userInfo || !user) {
    let searchParams = new URLSearchParams([["redirect", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  if (!currentTenant) {
    throw redirect(`/app`);
  }
  let {
    myTenants,
    pendingInvitations,
    mySubscription,
    allPermissions,
    superUserRole,
    superAdminRole,
    entities,
    entityGroups,
    allRoles,
    myGroups,
    onboardingSession,
  } = await time(
    promiseHash({
      myTenants: time(getMyTenants(user.id), "loadAppData.getDetails.getMyTenants"),
      pendingInvitations: time(getLinkedAccountsCount(tenantId, [LinkedAccountStatus.PENDING]), "loadAppData.getDetails.getLinkedAccountsCount"),
      mySubscription: time(getActiveTenantSubscriptions(tenantId), "loadAppData.getDetails.getActiveTenantSubscriptions"),
      allPermissions: time(getPermissionsByUser(userInfo.userId, tenantId), "loadAppData.getDetails.getPermissionsByUser"),
      superUserRole: time(getUserRoleInTenant(userInfo.userId, tenantId, DefaultAppRoles.SuperUser), "loadAppData.getDetails.getUserRoleInTenant"),
      superAdminRole: time(getUserRoleInAdmin(userInfo.userId, DefaultAdminRoles.SuperAdmin), "loadAppData.getDetails.getUserRoleInAdmin"),
      entities: time(
        getAllEntities({ tenantId, active: true, types: [DefaultEntityTypes.All, DefaultEntityTypes.AppOnly] }),
        "loadAppData.getDetails.getAllEntities"
      ),
      entityGroups: time(getAllEntityGroups(), "loadAppData.getDetails.getAllEntityGroups()"),
      allRoles: time(getAllRolesWithoutPermissions("app"), "loadAppData.getDetails.getAllRolesWithoutPermissions"),
      myGroups: time(getMyGroups(user.id, currentTenant.id), "loadAppData.getDetails.getMyGroups"),
      onboardingSession: time(
        OnboardingService.getUserActiveOnboarding({ userId: user.id, tenantId: currentTenant.id }),
        "loadAppData.getDetails.OnboardingService.getUserActiveOnboarding"
      ),
    }),
    "loadAppData.getDetails"
  );
  const childTenants = await time(getTenantRelationshipsFromByUserTenants(myTenants.map((f) => f.id)), "loadAppData.getDetails.getTenantRelationshipsFrom");
  const currentTenantAsChild = childTenants.find((f) => f.toTenantId === currentTenant.id);
  if (currentTenantAsChild) {
    allPermissions = [...allPermissions, ...currentTenantAsChild.tenantTypeRelationship.permissions.map((f) => f.name)];
  }

  const tenantUser = await getTenantUserType(tenantId, userInfo.userId);
  let currentRole = tenantUser?.type ?? TenantUserType.MEMBER;
  if (user.admin) {
    currentRole = TenantUserType.ADMIN;
  }
  const tenantTypes = await getAllTenantTypes();
  if (tenantTypes.length > 0) {
    const tenantEntities = await TenantEntitiesApi.getEntities({ tenantId, inTypes: currentTenant.types, enabledOnly: true });
    entities = tenantEntities.allEntities;
    let newGroups: EntityGroupWithDetails[] = [];
    entityGroups.forEach((group) => {
      group.entities = group.entities.filter((f) => entities.some((e) => e.id === f.entityId));
      if (group.entities.length > 0) {
        newGroups.push(group);
      }
    });
    entityGroups = newGroups;
  }

  const data: AppLoaderData = {
    i18n: i18n.translations,
    user,
    myTenants,
    childTenants,
    currentTenant,
    currentRole,
    mySubscription,
    pendingInvitations,
    entities,
    entityGroups,
    // roles,
    allRoles,
    permissions: allPermissions.map((f) => f as DefaultPermission),
    myGroups,
    isSuperUser: !!superUserRole,
    isSuperAdmin: !!superAdminRole,
    lng: user?.locale ?? userInfo.lng,
    onboardingSession,
    tenantTypes,
  };
  return data;
}
