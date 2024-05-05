import { EntityView } from "@prisma/client";
import { EntityWithDetails, getEntityByName } from "../db/entities/entities.db.server";
import {
  createEntityView,
  EntityViewWithDetails,
  getEntityView,
  getEntityViews,
  updateEntityView,
  updateEntityViewFilters,
  updateEntityViewProperties,
  updateEntityViewSort,
} from "../db/entities/entityViews.db.server";
import EntityViewHelper from "../helpers/EntityViewHelper";
import { RowsApi } from "./RowsApi";
import { getUser } from "../db/users.db.server";
import { getTenant } from "../db/tenants.db.server";

export namespace EntityViewsApi {
  export type GetEntityViewsWithRows = {
    view: EntityViewWithDetails | undefined;
    rowsData: RowsApi.GetRowsData;
    rowsCount: number;
  };
  export async function getAll({
    entityName,
    tenantId,
    withDefault = true,
    withRows = true,
  }: {
    entityName: string;
    tenantId: string | null;
    withDefault: boolean;
    withRows: boolean;
  }): Promise<GetEntityViewsWithRows[]> {
    const entity = await getEntityByName({ tenantId, name: entityName });
    const views = await getEntityViews(entity.id, { tenantId });
    let allViews: (EntityViewWithDetails | undefined)[] = views;
    if (withDefault) {
      allViews = [undefined, ...views];
    }
    return await Promise.all(
      allViews.map(async (entityView) => {
        let rowsData = await RowsApi.getAll({
          entity,
          tenantId,
          entityView,
          urlSearchParams: new URLSearchParams(),
          pageSize: 10000,
        });
        const rowsCount = rowsData.items.length;
        if (!withRows) {
          rowsData = { ...rowsData, items: [] };
        }
        const data: GetEntityViewsWithRows = {
          view: entityView,
          rowsData,
          rowsCount,
        };
        return data;
      })
    );
  }

  export async function get(
    id: string | undefined,
    { entityName, tenantId, pageSize }: { entityName: string; tenantId: string | null; pageSize?: number }
  ): Promise<GetEntityViewsWithRows | null> {
    const entity = await getEntityByName({ tenantId, name: entityName });
    if (!entity) {
      return null;
    }
    let view: EntityViewWithDetails | null = null;
    if (id) {
      view = await getEntityView(id);
      if (!view) {
        return null;
      }
    }
    const rowsData = await RowsApi.getAll({
      entity,
      tenantId,
      entityView: view ?? undefined,
      urlSearchParams: new URLSearchParams(),
      pageSize,
    });
    const data: GetEntityViewsWithRows = {
      view: view ?? undefined,
      rowsData,
      rowsCount: rowsData.items.length,
    };
    return data;
  }

  export async function createFromForm({ entity, form, createdByUserId }: { form: FormData; entity: EntityWithDetails; createdByUserId: string }) {
    const layout = form.get("layout")?.toString() ?? "";
    const name = form.get("name")?.toString().toLowerCase() ?? "";
    const title = form.get("title")?.toString() ?? "";
    const pageSize = Number(form.get("pageSize"));
    const isDefault = Boolean(form.get("isDefault"));
    // Board
    const groupBy = form.get("groupBy")?.toString() ?? undefined;
    const groupByPropertyId = form.get("groupByPropertyId")?.toString() ?? undefined;
    // Grid
    const gridColumns = Number(form.get("gridColumns") ?? 0);
    const gridColumnsSm = Number(form.get("gridColumnsSm") ?? 0);
    const gridColumnsMd = Number(form.get("gridColumnsMd") ?? 0);
    const gridColumnsLg = Number(form.get("gridColumnsLg") ?? 0);
    const gridColumnsXl = Number(form.get("gridColumnsXl") ?? 0);
    const gridColumns2xl = Number(form.get("gridColumns2xl") ?? 0);
    const gridGap = form.get("gridGap")?.toString() ?? "sm";

    const isSystem = form.get("isSystem") === "true";
    let tenantId: string | null = form.get("tenantId")?.toString() ?? null;
    let userId: string | null = form.get("userId")?.toString() ?? null;

    if (!tenantId?.toString().trim()) {
      tenantId = null;
    }
    if (!userId?.toString().trim()) {
      userId = null;
    }

    const errors = [
      ...(await EntityViewHelper.validateEntityView({ entityId: entity.id, isDefault, name, title, order: null, userId })),
      ...(await EntityViewHelper.validateGroupBy(entity, layout, groupBy, groupByPropertyId)),
    ];
    if (errors.length > 0) {
      throw Error(errors.join(", "));
    }

    const properties: { propertyId: string; name: string; order: number }[] = form.getAll("properties[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    if (properties.length === 0) {
      throw Error("Add at least one property to display");
    }

    const filters: { name: string; condition: string; value: string; match: string }[] = form.getAll("filters[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    const sort: { name: string; asc: boolean; order: number }[] = form.getAll("sort[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    if (tenantId) {
      const tenant = await getTenant(tenantId);
      if (!tenant) {
        // eslint-disable-next-line no-console
        console.log("Invalid account", { tenantId });
        throw Error("Invalid account");
      }
    }
    if (userId) {
      const user = await getUser(userId);
      if (!user) {
        // eslint-disable-next-line no-console
        console.log("Invalid user", { userId });
        throw Error("Invalid user");
      }
    }
    try {
      const entityView = await createEntityView({
        entityId: entity.id,
        tenantId: tenantId,
        userId: userId,
        createdByUserId,
        layout,
        name,
        title,
        isDefault,
        pageSize,
        groupByWorkflowStates: groupBy === "byWorkflowStates",
        groupByPropertyId: groupBy === "byProperty" ? groupByPropertyId ?? null : null,
        gridColumns,
        gridColumnsSm,
        gridColumnsMd,
        gridColumnsLg,
        gridColumnsXl,
        gridColumns2xl,
        gridGap,
        isSystem,
      });
      await updateEntityViewProperties(entityView.id, properties);
      await updateEntityViewFilters(entityView.id, filters);
      await updateEntityViewSort(entityView.id, sort);

      return entityView;
    } catch (e: any) {
      throw Error(e.message);
    }
  }

  export async function updateFromForm({ item, entity, form }: { item: EntityView; form: FormData; entity: EntityWithDetails }) {
    const layout = form.get("layout")?.toString() ?? "";
    const name = form.get("name")?.toString() ?? "";
    const title = form.get("title")?.toString() ?? "";
    const pageSize = Number(form.get("pageSize"));
    const order = Number(form.get("order"));
    const isDefault = Boolean(form.get("isDefault"));
    // Board
    const groupBy = form.get("groupBy")?.toString() ?? undefined;
    const groupByPropertyId = form.get("groupByPropertyId")?.toString() ?? undefined;
    // Grid
    const gridColumns = Number(form.get("gridColumns") ?? 0);
    const gridColumnsSm = Number(form.get("gridColumnsSm") ?? 0);
    const gridColumnsMd = Number(form.get("gridColumnsMd") ?? 0);
    const gridColumnsLg = Number(form.get("gridColumnsLg") ?? 0);
    const gridColumnsXl = Number(form.get("gridColumnsXl") ?? 0);
    const gridColumns2xl = Number(form.get("gridColumns2xl") ?? 0);
    const gridGap = form.get("gridGap")?.toString() ?? "sm";

    const errors = [
      ...(await EntityViewHelper.validateEntityView({ entityId: entity.id, isDefault, name, title, order, entityView: item, userId: item.userId })),
      ...(await EntityViewHelper.validateGroupBy(entity, layout, groupBy, groupByPropertyId)),
    ];
    if (errors.length > 0) {
      throw Error(errors.join(", "));
    }

    const properties: { propertyId: string; name: string; order: number }[] = form.getAll("properties[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    if (properties.length === 0) {
      throw Error("Add at least one property to display");
    }

    const filters: { name: string; condition: string; value: string; match: string }[] = form.getAll("filters[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    const sort: { name: string; asc: boolean; order: number }[] = form.getAll("sort[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });

    try {
      const view = await updateEntityView(item.id, {
        order,
        layout,
        name,
        title,
        isDefault,
        pageSize,
        groupByWorkflowStates: groupBy === "byWorkflowStates",
        groupByPropertyId: groupBy === "byProperty" ? groupByPropertyId ?? null : null,
        gridColumns,
        gridColumnsSm,
        gridColumnsMd,
        gridColumnsLg,
        gridColumnsXl,
        gridColumns2xl,
        gridGap,
      });
      await updateEntityViewProperties(item.id, properties);
      await updateEntityViewFilters(item.id, filters);
      await updateEntityViewSort(item.id, sort);

      return view;
    } catch (e: any) {
      throw Error(e.message);
    }
  }
}
