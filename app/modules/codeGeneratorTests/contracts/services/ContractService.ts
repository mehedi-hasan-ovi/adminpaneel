// Service: CRUD operations
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { RowsApi } from "~/utils/api/RowsApi";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import { getRowById } from "~/utils/db/entities/rows.db.server";
import RowHelper from "~/utils/helpers/RowHelper";
import RowValueHelper, { RowValueUpdateDto } from "~/utils/helpers/RowValueHelper";
import { RowMedia } from "@prisma/client";
import { ContractDto } from "../dtos/ContractDto";
import { ContractCreateDto } from "../dtos/ContractCreateDto";
import ContractHelpers from "../helpers/ContractHelpers";

export namespace ContractService {
  async function getEntity(tenantId: string | null) {
    let entityName = "contract";
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
    urlSearchParams: URLSearchParams;
  }): Promise<{ items: ContractDto[]; pagination: PaginationDto }> {
    const entity = await getEntity(tenantId);
    const data = await RowsApi.getAll({
      entity,
      tenantId,
      userId,
      urlSearchParams,
    });
    return {
      items: data.items.map((row) => ContractHelpers.rowToDto({ entity, row })),
      pagination: data.pagination,
    };
  }
  export async function get(id: string, session: { tenantId: string | null; userId?: string }): Promise<ContractDto | null> {
    const entity = await getEntity(session.tenantId);
    const { item, rowPermissions } = await RowsApi.get(id, {
      tenantId: session.tenantId,
      userId: session.userId,
      entity,
    });
    if (!rowPermissions.canRead) {
      return null;
    }
    return ContractHelpers.rowToDto({ entity, row: item });
  }
  export async function create(data: ContractCreateDto, session: { tenantId: string | null; userId?: string }): Promise<ContractDto> {
    const entity = await getEntity(session.tenantId);
    const rowValues = RowHelper.getRowPropertiesFromForm({
      entity,
      values: [
        { name: "name", value: data.name },
        { name: "type", value: data.type },
        { name: "description", value: data.description },
        { name: "document", media: data.document ? [data.document] : [] },
        { name: "attachments", media: data.attachments },
        { name: "estimatedAmount", value: data.estimatedAmount.toString() },
        { name: "active", value: data.active.toString() },
        { name: "estimatedCompletionDate", value: data.estimatedCompletionDate.toISOString() },
      ],
    });
    const item = await RowsApi.create({
      tenantId: session.tenantId,
      userId: session.userId,
      entity,
      rowValues,
    });
    return ContractHelpers.rowToDto({ entity, row: item });
  }
  export async function update(id: string, data: Partial<ContractDto>, session: { tenantId: string | null; userId?: string }): Promise<ContractDto> {
    const entity = await getEntity(session.tenantId);
    const row = await getRowById(id);
    if (!row) {
      throw Error("Not found");
    }
    const values: RowValueUpdateDto[] = [];
    if (data.name !== undefined) {
      values.push({ name: "name", textValue: data.name });
    }
    if (data.type !== undefined) {
      values.push({ name: "type", textValue: data.type });
    }
    if (data.description !== undefined) {
      values.push({ name: "description", textValue: data.description });
    }
    if (data.document !== undefined) {
      values.push({ name: "document", media: data.document ? [data.document as RowMedia] : [] });
    }
    if (data.documentSigned !== undefined) {
      values.push({ name: "documentSigned", media: data.documentSigned ? [data.documentSigned as RowMedia] : [] });
    }
    if (data.attachments !== undefined) {
      values.push({ name: "attachments", media: data.attachments ? (data.attachments as RowMedia[]) : [] });
    }
    if (data.estimatedAmount !== undefined) {
      values.push({ name: "estimatedAmount", numberValue: data.estimatedAmount });
    }
    if (data.realAmount !== undefined) {
      values.push({ name: "realAmount", numberValue: data.realAmount });
    }
    if (data.active !== undefined) {
      values.push({ name: "active", booleanValue: data.active });
    }
    if (data.estimatedCompletionDate !== undefined) {
      values.push({ name: "estimatedCompletionDate", dateValue: data.estimatedCompletionDate });
    }
    if (data.realCompletionDate !== undefined) {
      values.push({ name: "realCompletionDate", dateValue: data.realCompletionDate });
    }
    const item = await RowValueHelper.update({
      entity,
      row,
      values,
      session,
    });
    return ContractHelpers.rowToDto({ entity, row: item });
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
