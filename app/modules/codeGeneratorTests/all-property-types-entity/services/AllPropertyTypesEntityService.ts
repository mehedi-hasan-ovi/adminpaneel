// Service: CRUD operations
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { RowsApi } from "~/utils/api/RowsApi";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import { getRowById } from "~/utils/db/entities/rows.db.server";
import RowHelper from "~/utils/helpers/RowHelper";
import RowValueHelper, { RowValueUpdateDto } from "~/utils/helpers/RowValueHelper";
import { RowMedia } from "@prisma/client";
import { AllPropertyTypesEntityDto } from "../dtos/AllPropertyTypesEntityDto";
import { AllPropertyTypesEntityCreateDto } from "../dtos/AllPropertyTypesEntityCreateDto";
import AllPropertyTypesEntityHelpers from "../helpers/AllPropertyTypesEntityHelpers";

export namespace AllPropertyTypesEntityService {
  async function getEntity(tenantId: string | null) {
    let entityName = "allPropertyTypesEntity";
    const entity = await getEntityByName({ tenantId, name: entityName });
    if (!entity) {
      throw Error("Entity not found: " + entityName);
    }
    return entity;
  }
  export async function getAll({
    tenantId,
    userId,
    urlSearchParams,
  }: {
    tenantId: string | null;
    userId?: string;
    urlSearchParams?: URLSearchParams;
  }): Promise<{ items: AllPropertyTypesEntityDto[]; pagination: PaginationDto }> {
    const entity = await getEntity(tenantId);
    const data = await RowsApi.getAll({
      entity,
      tenantId,
      userId,
      urlSearchParams,
    });
    return {
      items: data.items.map((row) => AllPropertyTypesEntityHelpers.rowToDto({ entity, row })),
      pagination: data.pagination,
    };
  }
  export async function get(id: string, session: { tenantId: string | null; userId?: string }): Promise<AllPropertyTypesEntityDto | null> {
    const entity = await getEntity(session.tenantId);
    const { item, rowPermissions } = await RowsApi.get(id, {
      tenantId: session.tenantId,
      userId: session.userId,
      entity,
    });
    if (!rowPermissions.canRead) {
      return null;
    }
    return AllPropertyTypesEntityHelpers.rowToDto({ entity, row: item });
  }
  export async function create(data: AllPropertyTypesEntityCreateDto, session: { tenantId: string | null; userId?: string }): Promise<AllPropertyTypesEntityDto> {
    const entity = await getEntity(session.tenantId);
    const rowValues = RowHelper.getRowPropertiesFromForm({
      entity,
      values: [
        { name: "textSingleLine", value: data.textSingleLine },
        { name: "textEmail", value: data.textEmail },
        { name: "textPhone", value: data.textPhone },
        { name: "textUrl", value: data.textUrl },
        { name: "number", value: data.number.toString() },
        { name: "date", value: data.date.toISOString() },
        { name: "singleSelectDropdown", value: data.singleSelectDropdown },
        { name: "singleSelectRadioGroupCards", value: data.singleSelectRadioGroupCards },
        { name: "boolean", value: data.boolean.toString() },
        { name: "media", media: data.media },
        { name: "multiSelectCombobox", multiple: data.multiSelectCombobox },
        { name: "multiSelectCheckboxCards", multiple: data.multiSelectCheckboxCards },
        { name: "numberRange", range: data.numberRange },
        { name: "dateRange", range: data.dateRange },
        { name: "multiText", multiple: data.multiText },
      ],
    });
    const item = await RowsApi.create({
      tenantId: session.tenantId,
      userId: session.userId,
      entity,
      rowValues,
    });
    return AllPropertyTypesEntityHelpers.rowToDto({ entity, row: item });
  }
  export async function update(id: string, data: Partial<AllPropertyTypesEntityDto>, session: { tenantId: string | null; userId?: string }): Promise<AllPropertyTypesEntityDto> {
    const entity = await getEntity(session.tenantId);
    const row = await getRowById(id);
    if (!row) {
      throw Error("Not found");
    }
    const values: RowValueUpdateDto[] = [];
    if (data.textSingleLine !== undefined) {
values.push({ name: "textSingleLine", textValue: data.textSingleLine });
}
    if (data.textEmail !== undefined) {
values.push({ name: "textEmail", textValue: data.textEmail });
}
    if (data.textPhone !== undefined) {
values.push({ name: "textPhone", textValue: data.textPhone });
}
    if (data.textUrl !== undefined) {
values.push({ name: "textUrl", textValue: data.textUrl });
}
    if (data.number !== undefined) {
values.push({ name: "number", numberValue: data.number });
}
    if (data.date !== undefined) {
values.push({ name: "date", dateValue: data.date });
}
    if (data.singleSelectDropdown !== undefined) {
values.push({ name: "singleSelectDropdown", textValue: data.singleSelectDropdown });
}
    if (data.singleSelectRadioGroupCards !== undefined) {
values.push({ name: "singleSelectRadioGroupCards", textValue: data.singleSelectRadioGroupCards });
}
    if (data.boolean !== undefined) {
values.push({ name: "boolean", booleanValue: data.boolean });
}
    if (data.media !== undefined) {
values.push({ name: "media", media: data.media ? data.media as RowMedia[] : [] });
}
    if (data.multiSelectCombobox !== undefined) {
values.push({ name: "multiSelectCombobox", multiple: data.multiSelectCombobox });
}
    if (data.multiSelectCheckboxCards !== undefined) {
values.push({ name: "multiSelectCheckboxCards", multiple: data.multiSelectCheckboxCards });
}
    if (data.numberRange !== undefined) {
values.push({ name: "numberRange", range: data.numberRange });
}
    if (data.dateRange !== undefined) {
values.push({ name: "dateRange", range: data.dateRange });
}
    if (data.multiText !== undefined) {
values.push({ name: "multiText", multiple: data.multiText });
}
    const item = await RowValueHelper.update({
      entity,
      row,
      values,
      session,
    });
    return AllPropertyTypesEntityHelpers.rowToDto({ entity, row: item });
  }
  export async function del(id: string, session: { tenantId: string | null; userId?: string }): Promise<void> {
    const entity = await getEntity(session.tenantId);
    await RowsApi.del(id, {
      entity,
      tenantId: session.tenantId,
      userId: session.userId,
    });
  }
}