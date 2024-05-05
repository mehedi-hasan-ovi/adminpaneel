import { Entity } from "@prisma/client";
import { TFunction } from "i18next";
import { DefaultEntityTypes } from "~/application/dtos/shared/DefaultEntityTypes";
import { Stat } from "~/application/dtos/stats/Stat";
import { getStatChangePercentage, getStatChangeType } from "../app/DashboardUtils";
import { db } from "../db.server";
import { getAllEntities } from "../db/entities/entities.db.server";
import TenantHelper from "../helpers/TenantHelper";
import { TenantSimple } from "../db/tenants.db.server";
import { getAllTenantTypes } from "../db/tenants/tenantTypes.db.server";
import { TenantEntitiesApi } from "../api/TenantEntitiesApi";

export async function getAppDashboardStats({
  t,
  tenant,
  gte,
}: {
  t: TFunction;
  tenant: TenantSimple | null;
  gte: Date | undefined | undefined;
}): Promise<Stat[]> {
  if (!tenant) {
    return [];
  }
  let entities = await getAllEntities({ tenantId: tenant.id, active: true, types: [DefaultEntityTypes.All, DefaultEntityTypes.AppOnly] });
  const tenantTypes = await getAllTenantTypes();
  if (tenantTypes.length > 0) {
    const tenantEntities = await TenantEntitiesApi.getEntities({ tenantId: tenant.id, inTypes: tenant.types, enabledOnly: true });
    entities = tenantEntities.allEntities;
  }
  const promises = entities.map((entity) => getEntityStat(entity, tenant.id, gte));
  const stats = await Promise.all(promises);
  return stats;
}

export async function getEntityStat(entity: Entity, tenantId: string, gte: Date | undefined) {
  const { total, added } = await getRowsCreatedSince(entity.id, tenantId, gte);

  const stat: Stat = {
    name: entity.titlePlural,
    hint: "",
    stat: added.toString(),
    previousStat: (total - added).toString(),
    change: getStatChangePercentage(added, total) + "%",
    changeType: getStatChangeType(added, total),
    path: "/app/:tenant/" + entity.slug,
  };
  return stat;
}

async function getRowsCreatedSince(entityId: string, tenantId: string, gte: Date | undefined) {
  const added = await db.row.count({
    where: {
      entityId,
      createdAt: {
        gte,
      },
      ...TenantHelper.tenantCondition({ tenantId }),
    },
  });
  const total = await db.row.count({
    where: {
      entityId,
      ...TenantHelper.tenantCondition({ tenantId }),
    },
  });

  return {
    added,
    total,
  };
}
