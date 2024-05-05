import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { EntityWithDetails, getEntityByIdOrName } from "../db/entities/entities.db.server";
import { getEntityPermission, getUserPermission } from "../helpers/PermissionsHelper";
import { getPlanFeatureUsage } from "../services/subscriptionService";
import { getMyTenants } from "../db/tenants.db.server";
import { getTenantRelationshipsFromByUserTenants } from "../db/tenants/tenantRelationships.db.server";

export namespace EntitiesApi {
  export type GetEntityData = {
    entity: EntityWithDetails;
    featureUsageEntity?: PlanFeatureUsageDto | undefined;
  };
  export type Routes = {
    list?: string;
    new?: string;
    overview?: string;
    edit?: string;
    publicUrl?: string;
    import?: string;
    export?: string;
    group?: string;
  };
  export async function get({ entity, tenantId, userId }: { entity: { id?: string; name?: string }; tenantId?: string | null; userId?: string }) {
    const item = await getEntityByIdOrName({ tenantId, ...entity });
    if (userId) {
      const { permission, userPermission } = await getUserPermission({ userId, permissionName: getEntityPermission(item, "create"), tenantId });
      if (permission && !userPermission) {
        // TODO: IMPROVE
        const myTenants = await getMyTenants(userId);
        const childTenants = await getTenantRelationshipsFromByUserTenants(myTenants.map((f) => f.id));
        const currentTenantAsChild = childTenants.find((f) => f.toTenantId === tenantId);
        const existingPermission = currentTenantAsChild?.tenantTypeRelationship.permissions.find((f) => f.name === getEntityPermission(item, "create"));
        // TODO: END IMPROVE
        if (!existingPermission) {
          throw new Error(`User does not have permission to view entity ${entity.name}`);
        }
      }
    }

    const featureUsageEntity = tenantId ? await getPlanFeatureUsage(tenantId, item.name) : undefined;
    const data: GetEntityData = {
      entity: item,
      featureUsageEntity,
    };
    return data;
  }
}
