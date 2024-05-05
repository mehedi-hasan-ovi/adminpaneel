import { EntityTag, EntityWorkflowState, Prisma, Row, RowPermission } from "@prisma/client";
import { EntityWithDetails, getAllEntities, getEntityByIdOrName } from "~/utils/db/entities/entities.db.server";
import { EntityViewWithDetails, getEntityViews } from "~/utils/db/entities/entityViews.db.server";
import { countRows, createRow, deleteRow, getRow, getRowById, getRows, RowWithDetails, updateRow } from "~/utils/db/entities/rows.db.server";
import { FilterablePropertyDto } from "../../application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "../../application/dtos/data/PaginationDto";
import { createEntityTag, getEntityTag, getEntityTags } from "../db/entities/entityTags.db.server";
import { getWorkflowStates } from "../db/workflows/workflowStates.db.server";
import EntityViewHelper from "../helpers/EntityViewHelper";
import { getEntityPermission, getUserPermission, getUserRowPermission } from "../helpers/PermissionsHelper";
import { getPaginationFromCurrentUrl, getEntityFiltersFromCurrentUrl, getRowsWithPagination } from "../helpers/RowPaginationHelper";
import Constants from "~/application/Constants";
import { createManualRowLog, getRowLogs, LogWithDetails } from "../db/logs.db.server";
import { DefaultLogActions } from "~/application/dtos/shared/DefaultLogActions";
import { RowValueDto } from "~/application/dtos/entities/RowValueDto";
import { getUser } from "../db/users.db.server";
import { getRowComments, RowCommentWithDetails } from "../db/entities/rowComments.db.server";
import { getAllRowTasks, getRowTasks, RowTaskWithDetails } from "../db/entities/rowTasks.db.server";
import { createRowTag, deleteRowTag, getRowTagByIds, getRowTags, RowTagWithDetails } from "../db/entities/rowTags.db.server";
import { RowPermissionsDto } from "~/application/dtos/entities/RowPermissionsDto";
import { EntityWorkflowStepWithDetails, getWorkflowStepsFromState } from "../db/workflows/workflowSteps.db.server";
import { getRowPermissions } from "../db/permissions/rowPermissions.db.server";
import { EntityRelationshipWithDetails } from "../db/entities/entityRelationships.db.server";
import { Colors } from "~/application/enums/shared/Colors";
import { getPlanFeatureUsage, reportUsage } from "../services/subscriptionService";
import { TFunction } from "react-i18next";
import RowHelper from "../helpers/RowHelper";
import { db } from "../db.server";
import { promiseHash } from "../promises/promiseHash";
import { TimeFunction, timeFake } from "~/modules/metrics/utils/MetricTracker";
import RelationshipHelper from "../helpers/RelationshipHelper";
import { getMyTenants } from "../db/tenants.db.server";
import { getTenantRelationshipsFromByUserTenants } from "../db/tenants/tenantRelationships.db.server";
import { RowHooks } from "../hooks/RowHooks";
import { DefaultVisibility } from "~/application/dtos/shared/DefaultVisibility";
import { storeRowMediaInStorageProvider } from "../helpers/MediaHelper";
import { RowPermissionsApi } from "./RowPermissionsApi";
import { PromptFlowWithDetails, getPromptFlowsByEntity } from "~/modules/promptBuilder/db/promptFlows.db.server";

export namespace RowsApi {
  export type GetRowsData = {
    results: number;
    entity: EntityWithDetails;
    items: RowWithDetails[];
    tags: EntityTag[];
    pagination: PaginationDto;
    workflowStates: EntityWorkflowState[];
    views: EntityViewWithDetails[];
    currentView: EntityViewWithDetails | null;
    filterableProperties?: FilterablePropertyDto[];
    allEntities: EntityWithDetails[];
    promptFlows: PromptFlowWithDetails[];
  };
  export async function getAll({
    entity,
    tenantId,
    userId,
    urlSearchParams,
    pageSize,
    includePublic,
    entityView,
    rowWhere,
    time,
  }: {
    entity: { id?: string; name?: string };
    tenantId?: string | null;
    userId?: string;
    urlSearchParams?: URLSearchParams;
    pageSize?: number;
    includePublic?: boolean;
    entityView?: EntityViewWithDetails;
    rowWhere?: Prisma.RowWhereInput;
    time?: TimeFunction;
  }): Promise<GetRowsData> {
    if (!time) {
      time = timeFake;
    }
    if (!urlSearchParams) {
      urlSearchParams = new URLSearchParams();
    }
    const rowEntity: EntityWithDetails | undefined = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.getAll.1.getEntityByIdOrName");
    if (!rowEntity) {
      throw Error("Entity not found: " + rowEntity);
    }
    await RowHooks.onBeforeGetAll({ entity: rowEntity, tenantId, userId, urlSearchParams });
    await time(validateEntityPermission({ userId, entity: rowEntity, tenantId, name: "view" }), "RowsApi.getAll.2.validateEntityPermission");
    const views = await time(
      getEntityViews(rowEntity.id, {
        tenantId,
        userId,
      }),
      "RowsApi.getAll.3.getEntityViews"
    );
    let currentView = entityView ?? (await time(EntityViewHelper.getCurrentEntityView(rowEntity.id, urlSearchParams), "RowsApi.getAll.4.getCurrentEntityView"));

    const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
    const filters = getEntityFiltersFromCurrentUrl(true, rowEntity, urlSearchParams, currentView);
    if (!pageSize) {
      pageSize = Constants.DEFAULT_PAGE_SIZE;
      const urlPageSize = Number(urlSearchParams.get("pageSize"));
      if (currentView && currentView?.pageSize > 0) {
        pageSize = currentView.pageSize;
      }
      if (urlPageSize !== 0) {
        pageSize = urlPageSize;
      }
    }
    const { items, pagination } = await getRowsWithPagination({
      entityId: entity.id,
      entityName: entity.name,
      tenantId,
      userId,
      pageSize,
      page: currentPagination.page,
      sortedBy: currentPagination.sortedBy,
      filters,
      includePublic,
      rowWhere,
    });

    const { tags, workflowStates, allEntities, promptFlows } = await time(
      promiseHash({
        tags: getEntityTags(rowEntity.id),
        workflowStates: getWorkflowStates(rowEntity.id),
        allEntities: getAllEntities({ tenantId, active: true }),
        promptFlows: getPromptFlowsByEntity(rowEntity.id),
      }),
      "RowsApi.getAll.5.details"
    );
    await RowHooks.onAfterGetAll({ entity: rowEntity, tenantId, userId, urlSearchParams, items, pagination });

    const data: GetRowsData = {
      results: items.length,
      entity: rowEntity,
      pagination,
      items,
      tags,
      workflowStates,
      views,
      currentView,
      // filterableProperties,
      allEntities,
      promptFlows,
    };
    return data;
  }

  export type GetRowData = {
    entity: EntityWithDetails;
    item: RowWithDetails;
    logs: LogWithDetails[];
    comments: RowCommentWithDetails[];
    tasks: RowTaskWithDetails[];
    tags: RowTagWithDetails[];
    permissions: RowPermission[];
    rowPermissions: RowPermissionsDto;
    nextWorkflowSteps: EntityWorkflowStepWithDetails[];
    allEntities: EntityWithDetails[];
    promptFlows: PromptFlowWithDetails[];
  };
  export async function get(
    id: string,
    {
      entity,
      tenantId,
      userId,
      time,
    }: {
      entity: { id?: string; name?: string } | EntityWithDetails;
      tenantId?: string | null;
      userId?: string;
      time?: TimeFunction;
    }
  ): Promise<GetRowData> {
    if (!time) {
      time = timeFake;
    }
    let rowEntity: EntityWithDetails | undefined;
    // if entity is not type of EntityWithDetails, then get it from id or name
    if (!entity.id || !entity.name) {
      rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.get.getEntityByIdOrName");
    } else {
      rowEntity = entity as EntityWithDetails;
    }
    if (!rowEntity) {
      throw Error("Entity not found: " + rowEntity);
    }
    await RowHooks.onBeforeGet({ id, entity: rowEntity, tenantId, userId });
    await time(validateEntityPermission({ userId, entity: rowEntity, tenantId, name: "read" }), "RowsApi.get.validateEntityPermission");
    const item = await time(getRow(rowEntity.id, id, tenantId), "RowsApi.get.getRow");
    if (!item) {
      const existing = await time(getRowById(id), "RowsApi.get.getRowById");
      if (!existing) {
        throw Error(`${rowEntity.name} not found: ${id}`);
      }
      if (existing?.entityId !== entity.id) {
        throw Error(`Row exists, but not in entity ${entity.name}`);
      } else if (tenantId !== undefined && existing?.tenantId !== tenantId) {
        throw Error(`Row exists, but not in tenant ${tenantId}`);
      }
      throw Error("Not found");
    }
    const rowPermissions = await time(getUserRowPermission(item, tenantId, userId), "RowsApi.get.getUserRowPermission");
    if (!rowPermissions.canRead) {
      throw Error("You don't have access to this row");
    }
    const { nextWorkflowSteps, logs, tags, comments, tasks, permissions, allEntities, promptFlows } = await time(
      promiseHash({
        nextWorkflowSteps: getWorkflowStepsFromState(rowEntity.id, item.workflowStateId ?? ""),
        logs: getRowLogs(item.tenantId, item.id),
        tags: getRowTags(item.id),
        comments: getRowComments(item.id),
        tasks: getRowTasks(item.id),
        permissions: getRowPermissions(item.id),
        allEntities: getAllEntities({ tenantId, active: true }),
        promptFlows: getPromptFlowsByEntity(rowEntity.id),
      }),
      "RowsApi.get.details"
    );
    await RowHooks.onAfterGet({ id, entity: rowEntity, tenantId, userId, item });
    const data: GetRowData = {
      item,
      entity: rowEntity,
      logs,
      tags,
      comments,
      tasks,
      permissions,
      rowPermissions,
      nextWorkflowSteps,
      allEntities,
      promptFlows,
    };
    return data;
  }

  export type GetRelationshipRowsData = {
    relationship: EntityRelationshipWithDetails;
    rows: RowWithDetails[];
  }[];
  export async function getRelationshipRows({
    entity,
    tenantId,
    userId,
    time,
  }: {
    entity: EntityWithDetails;
    tenantId: string | null;
    userId?: string;
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    const relationshipRows: GetRelationshipRowsData = [];
    await time(
      Promise.all(
        entity.parentEntities
          .filter((relationship) => RelationshipHelper.getInputType({ fromEntityId: entity.id, relationship }) === "single-select")
          .map((parent) =>
            RowsApi.getAll({ entity: { id: parent.parentId }, tenantId, userId, urlSearchParams: new URLSearchParams(), pageSize: 100 }).then((rowsData) => {
              relationshipRows.push({ relationship: parent, rows: rowsData.items });
            })
          )
      ),
      "RowsApi.getRelationshipRows.getParentEntities"
    );

    await time(
      Promise.all(
        entity.childEntities
          .filter((relationship) => RelationshipHelper.getInputType({ fromEntityId: entity.id, relationship }) === "single-select")
          .map(async (child) => {
            const rowsData = await RowsApi.getAll({ entity: { id: child.childId }, tenantId, userId, urlSearchParams: new URLSearchParams(), pageSize: 100 });
            relationshipRows.push({ relationship: child, rows: rowsData.items });
          })
      ),
      "RowsApi.getRelationshipRows.getChildEntities"
    );

    return relationshipRows;
  }

  export type CreateRowActionData = RowWithDetails;
  type CreateRowInput = {
    entity: { id?: string; name?: string } | EntityWithDetails;
    tenantId: string | null;
    userId?: string;
    rowValues?: {
      dynamicProperties: RowValueDto[];
      properties?: any;
      parentRows?: { relationshipId: string; parentId: string }[];
      childRows?: { relationshipId: string; childId: string }[];
    };
    rowCreateInput?: Partial<Prisma.RowCreateInput>;
    nextFolio?: number;
    nextOrder?: number;
    options?: {
      checkUsage: boolean;
      createLog: boolean;
      createEvent: boolean;
      storeMedia: boolean;
      reportUsage: boolean;
    };
  };
  export async function create({
    entity,
    tenantId,
    userId,
    rowValues,
    rowCreateInput,
    nextOrder,
    nextFolio,
    time,
    options,
  }: CreateRowInput & {
    time?: TimeFunction;
  }): Promise<CreateRowActionData> {
    if (!time) {
      time = timeFake;
    }
    let rowEntity: EntityWithDetails | undefined;
    if (!entity.id || !entity.name) {
      rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.get.getEntityByIdOrName");
    } else {
      rowEntity = entity as EntityWithDetails;
    }
    if (options?.checkUsage === undefined || options?.checkUsage) {
      if (tenantId) {
        const usage = await time(getPlanFeatureUsage(tenantId, rowEntity.name), "RowsApi.create.getPlanFeatureUsage");
        if (usage && !usage.enabled) {
          throw Error(usage.message);
        }
      }
    }
    await RowHooks.onBeforeCreate({ entity: rowEntity, tenantId, userId, rowValues });
    const item = await time(
      createRow({
        entity: rowEntity,
        data: {
          tenantId,
          createdByUserId: userId,
          dynamicProperties: rowValues?.dynamicProperties,
          properties: rowValues?.properties,
          parentRows: rowValues?.parentRows,
          childRows: rowValues?.childRows,
          rowCreateInput,
        },
        nextFolio,
        nextOrder,
      }),
      "RowsApi.create.createRow"
    );

    const createdRow = await getRowById(item.id);
    if (!createdRow) {
      throw Error("Row not found");
    }

    if (options?.createEvent === undefined || options?.createEvent === true) {
      //  await createRowCreatedEvent(tenantId, {
      //    entity: { id: rowEntity.id, name: entity?.name ?? "", slug: rowEntity?.slug ?? "" },
      //    folio: createdRow.folio,
      //    tenantId: createdRow.tenantId,
      //    visibility: "",
      //    id: createdRow.id,
      //    ...(await getRowUserOrApiKey({ userId: createdRow.createdByUserId, apiKeyId: createdRow.createdByApiKeyId })),
      //  });
    }

    if (entity && createdRow) {
      if (options?.storeMedia === undefined || options?.storeMedia === true) {
        await storeRowMediaInStorageProvider(rowEntity, createdRow);
      }
      if (options?.reportUsage === undefined || options?.reportUsage === true) {
        if (tenantId) {
          await reportUsage(tenantId, rowEntity.name);
        }
      }
      await RowPermissionsApi.shareWithDefault(createdRow, rowEntity.defaultVisibility as DefaultVisibility);
    }

    if (options?.createLog === undefined || options?.createLog) {
      await time(
        createManualRowLog({ tenantId, createdByUserId: userId, action: DefaultLogActions.Created, entity: rowEntity, item: createdRow }),
        "RowsApi.create.createManualRowLog"
      );
    }
    await RowHooks.onAfterCreate({ entity: rowEntity, tenantId, userId, item: createdRow, rowValues });

    return createdRow;
  }

  export async function createSimple({
    entity,
    tenantId,
    userId,
    rowValues,
    rowCreateInput,
    nextOrder,
    nextFolio,
    time,
  }: CreateRowInput & {
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    let rowEntity: EntityWithDetails | undefined;
    if (!entity.id || !entity.name) {
      rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.get.getEntityByIdOrName");
    } else {
      rowEntity = entity as EntityWithDetails;
    }
    const item = await time(
      createRow({
        entity: rowEntity,
        data: {
          tenantId,
          createdByUserId: userId,
          dynamicProperties: rowValues?.dynamicProperties,
          properties: rowValues?.properties,
          parentRows: rowValues?.parentRows,
          childRows: rowValues?.childRows,
          rowCreateInput,
        },
        nextFolio,
        nextOrder,
      }),
      "RowsApi.create.createRow"
    );

    await RowPermissionsApi.shareWithDefault(item, rowEntity.defaultVisibility as DefaultVisibility);

    return item;
  }

  export type EditRowData = RowWithDetails;
  export async function update(
    id: string,
    {
      entity,
      tenantId,
      userId,
      rowValues,
      rowUpdateInput,
      checkPermissions = true,
      time,
      options,
    }: {
      entity: { id?: string; name?: string };
      tenantId: string | null;
      userId?: string;
      rowValues: {
        dynamicProperties: RowValueDto[];
        properties?: any;
        parentRows?: { relationshipId: string; parentId: string }[];
        childRows?: { relationshipId: string; childId: string }[];
      };
      rowUpdateInput?: Prisma.RowUpdateInput;
      checkPermissions?: boolean;
      time?: TimeFunction;
      options?: {
        checkUsage?: boolean;
        createLog?: boolean;
      };
    }
  ): Promise<CreateRowActionData> {
    if (!time) {
      time = timeFake;
    }
    const rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.update.getEntityByIdOrName");
    const row = await time(getRowById(id), "RowsApi.update.getRowById");
    if (checkPermissions) {
      const { permissions } = await time(
        promiseHash({
          permissions: getUserRowPermission(row!, tenantId, userId),
          entityPermission: validateEntityPermission({ userId, entity: rowEntity, tenantId, name: "update" }),
        }),
        "RowsApi.update.permissions"
      );

      if (userId !== undefined && !permissions.canUpdate) {
        throw Error("You don't have access to update this row");
      }
    }
    await RowHooks.onBeforeUpdate({ id, item: row!, entity: rowEntity, tenantId, userId, rowValues });
    const item = await time(
      updateRow(id, {
        dynamicProperties: rowValues.dynamicProperties,
        properties: rowValues.properties,
        parentRows: rowValues.parentRows,
        childRows: rowValues.childRows,
        rowUpdateInput,
      }),
      "RowsApi.update.updateRow"
    );
    // await FormulaService.trigger({ trigger: "ON_UPDATE", rows: item ? [item] : [], entity: rowEntity, session: { tenantId, userId } });
    if (options?.createLog === undefined || options?.createLog) {
      await time(
        createManualRowLog({ tenantId, createdByUserId: userId, action: DefaultLogActions.Updated, entity: rowEntity, item }),
        "RowsApi.update.createManualRowLog"
      );
    }
    await RowHooks.onAfterUpdate({ id, entity: rowEntity, tenantId, userId, rowValues, item });
    return item;
  }

  export async function del(
    id: string,
    {
      entity,
      tenantId,
      userId,
      checkPermissions = true,
      time,
    }: {
      entity: { id?: string; name?: string };
      tenantId?: string | null;
      userId?: string;
      checkPermissions?: boolean;
      time?: TimeFunction;
    }
  ) {
    if (!time) {
      time = timeFake;
    }
    const rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.del.getEntityByIdOrName");
    const row = await time(getRowById(id), "RowsApi.del.getRowById");
    if (!row) {
      throw Error("Row not found");
    }
    await RowHooks.onBeforeDelete({ id, item: row, entity: rowEntity, tenantId, userId });
    if (checkPermissions) {
      const { permissions } = await time(
        promiseHash({
          permissions: getUserRowPermission(row!, tenantId, userId),
          entityPermission: validateEntityPermission({ userId, entity: rowEntity, tenantId, name: "delete" }),
        }),
        "RowsApi.del.permissions"
      );
      if (!permissions.canDelete) {
        throw Error("You don't have access to update this row");
      }
    }
    if (row) {
      for (const child of row.childRows) {
        const relationship = rowEntity.childEntities.find((f) => f.id === child.relationshipId);
        if (relationship?.cascade) {
          await time(del(child.childId, { entity: { id: relationship.childId }, tenantId, userId, checkPermissions }), "RowsApi.del.childRows");
        }
      }
    }
    await time(
      createManualRowLog({ tenantId: row?.tenantId ?? null, createdByUserId: userId, action: DefaultLogActions.Deleted, entity: rowEntity, item: row }),
      "RowsApi.del.createManualRowLog"
    );
    const deleted = await deleteRow(id);
    await RowHooks.onAfterDelete({ id, entity: rowEntity, tenantId, userId, item: row });
    return deleted;
  }

  export async function count({
    entity,
    tenantId,
    userId,
    rowWhere,
    includePublic,
    time,
  }: {
    entity: { id?: string; name?: string };
    tenantId: string | null;
    userId?: string;
    rowWhere?: Prisma.RowWhereInput;
    includePublic?: boolean;
    time?: TimeFunction;
  }): Promise<number> {
    if (!time) {
      time = timeFake;
    }
    const rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.count.getEntityByIdOrName");
    if (!rowEntity) {
      throw Error("Entity not found");
    }
    return await time(countRows({ entityId: rowEntity.id, tenantId, userId, rowWhere, includePublic }), "RowsApi.count.countRows");
  }

  export async function getTasks({ completed, assignedOrCreatedUserId, time }: { completed?: boolean; assignedOrCreatedUserId?: string; time?: TimeFunction }) {
    if (!time) {
      time = timeFake;
    }
    return await time(getAllRowTasks({ completed, assignedOrCreatedUserId }), "RowsApi.getTasks.getAllRowTasks");
  }

  export async function find({
    entity,
    tenantId,
    properties,
    time,
  }: {
    entity: { id?: string; name?: string };
    tenantId?: string | null;
    properties: { name: string; value: string | null }[];
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    const rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.find.getEntityByIdOrName");
    if (!rowEntity) {
      throw Error("Entity not found");
    }
    const rows = await time(
      getRows({
        entityId: entity.id,
        entityName: entity.name,
        tenantId,
        filters: {
          customRow: false,
          entity: rowEntity,
          query: null,
          tags: [],
          properties: properties.map((f) => {
            return {
              property: rowEntity.properties.find((p) => p.name === f.name),
              value: f.value,
              condition: "equals",
            };
          }),
        },
      }),
      "RowsApi.find.getRows"
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  export async function findMany({
    entity,
    tenantId,
    properties,
    time,
  }: {
    entity: { id?: string; name?: string };
    tenantId?: string | null;
    properties: { name: string; value: string | null }[];
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    const rowEntity = await time(getEntityByIdOrName({ tenantId, ...entity }), "RowsApi.findMany.getEntityByIdOrName");
    if (!rowEntity) {
      throw Error("Entity not found");
    }
    const rows = await time(
      getRows({
        entityId: entity.id,
        entityName: entity.name,
        tenantId,
        filters: {
          customRow: false,
          entity: rowEntity,
          query: null,
          tags: [],
          properties: properties.map((f) => {
            return {
              property: rowEntity.properties.find((p) => p.name === f.name),
              value: f.value,
              condition: "equals",
              match: "or",
            };
          }),
        },
      }),
      "RowsApi.findMany.getRows"
    );

    return rows;
  }

  export async function addTag({ row, tag, time }: { row: Row; tag: { value: string; color?: Colors }; time?: TimeFunction }) {
    if (!time) {
      time = timeFake;
    }
    let existingTag = await time(getEntityTag(row.entityId, tag.value), "RowsApi.addTag.getEntityTag");
    if (!existingTag) {
      existingTag = await time(
        createEntityTag({
          entityId: row.entityId,
          value: tag.value,
          color: tag.color ?? Colors.GRAY,
        }),
        "RowsApi.addTag.createEntityTag"
      );
    }
    return await time(
      createRowTag({
        rowId: row.id,
        tagId: existingTag.id,
      }),
      "RowsApi.addTag.createRowTag"
    );
  }

  export async function removeTag({ row, tag, time }: { row: Row; tag: string; time?: TimeFunction }) {
    if (!time) {
      time = timeFake;
    }
    const entityTag = await time(getEntityTag(row.entityId, tag), "RowsApi.removeTag.getEntityTag");
    if (entityTag) {
      const rowTag = await time(getRowTagByIds(row.id, entityTag.id), "RowsApi.removeTag.getRowTagByIds");
      if (rowTag) {
        return await time(deleteRowTag(rowTag.id), "RowsApi.removeTag.deleteRowTag");
      }
    }
  }

  async function validateEntityPermission({
    userId,
    entity,
    tenantId,
    name,
  }: {
    entity: { name: string };
    name: "view" | "read" | "create" | "update" | "delete";
    userId?: string;
    tenantId?: string | null;
  }) {
    if (userId && tenantId) {
      const permissionName = getEntityPermission(entity, name);
      const { permission, userPermission } = await getUserPermission({ userId, permissionName, tenantId });
      if (permission && !userPermission) {
        const user = await getUser(userId);
        // TODO: IMPROVE
        const myTenants = await getMyTenants(userId);
        const childTenants = await getTenantRelationshipsFromByUserTenants(myTenants.map((f) => f.id));
        const currentTenantAsChild = childTenants.find((f) => f.toTenantId === tenantId);
        const existingPermission = currentTenantAsChild?.tenantTypeRelationship.permissions.find((f) => f.name === permissionName);
        // TODO: END IMPROVE
        if (!existingPermission) {
          throw Error(`${user?.email} does not have permission to view entity ${entity.name} (${permissionName})`);
        }
      }
    }
  }
  export async function createCustom({
    entity,
    t,
    form,
    row,
    tenantId,
    userId,
    rowCreateInput,
    time,
  }: {
    entity: EntityWithDetails;
    tenantId: string | null;
    userId?: string;
    t: TFunction;
    form: FormData;
    row: RowWithDetails | undefined;
    rowCreateInput?: Partial<Prisma.RowCreateInput> | undefined;
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    const rowValues = RowHelper.getRowPropertiesFromForm({ t, entity, form, existing: row });
    if (!row) {
      await time(
        RowsApi.create({
          entity,
          tenantId,
          userId,
          rowValues,
          rowCreateInput,
        }),
        "RowsApi.createCustom.create"
      );
    } else {
      await time(
        RowsApi.update(row.id, {
          entity,
          tenantId,
          rowValues,
        }),
        "RowsApi.createCustom.update"
      );
    }
  }
  export async function changeOrder(
    id: string,
    {
      target,
      time,
    }: {
      target: "up" | "down";
      time?: TimeFunction;
    }
  ) {
    if (!time) {
      time = timeFake;
    }
    const row = await time(getRowById(id), "RowsApi.changeOrder.getRowById");
    if (!row) {
      throw Error("Row not found");
    }
    const order = target === "up" ? row.order + 1 : row.order - 1;
    const swapRow = await time(
      db.row.findFirst({
        where: {
          entityId: row.entityId,
          tenantId: row.tenantId,
          order,
        },
      }),
      "RowsApi.changeOrder.findFirst"
    );

    // Check if multiple rows have the same order value
    const sameOrderRows = await time(
      db.row.findMany({
        where: {
          entityId: row.entityId,
          tenantId: row.tenantId,
          order: row.order,
        },
      }),
      "RowsApi.changeOrder.findMany"
    );

    if (sameOrderRows.length > 1) {
      // If multiple rows have the same order value, assign a unique order value to each row
      await time(
        db.$transaction(
          sameOrderRows.map((row, index) =>
            db.row.update({
              where: { id: row.id },
              data: { order: index + 1 },
            })
          )
        ),
        "RowsApi.changeOrder.$transaction"
      );
    } else if (swapRow) {
      // If there's only one row with the same order value, swap the order values of the two rows
      await time(
        db.$transaction([db.row.update({ where: { id: row.id }, data: { order } }), db.row.update({ where: { id: swapRow.id }, data: { order: row.order } })]),
        "RowsApi.changeOrder.$transaction"
      );
    }
  }
}
