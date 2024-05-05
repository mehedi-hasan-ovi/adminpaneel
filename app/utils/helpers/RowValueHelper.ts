import { Entity, Property, Prisma, RowMedia, RowValue, RowValueMultiple, RowValueRange } from "@prisma/client";
import { RowValueDto } from "~/application/dtos/entities/RowValueDto";
import { RowsApi } from "../api/RowsApi";
import { RowValueWithDetails } from "../db/entities/rows.db.server";
import RowHelper from "./RowHelper";
import { db } from "../db.server";
import { RowValueMultipleDto } from "~/application/dtos/entities/RowValueMultipleDto";
import { RowValueRangeDto } from "~/application/dtos/entities/RowValueRangeDto";
import { PropertyWithDetails } from "../db/entities/entities.db.server";

export type RowValueUpdateDto = {
  name: string;
  textValue?: string | undefined;
  numberValue?: number | undefined;
  dateValue?: Date | undefined;
  booleanValue?: boolean | undefined;
  media?: RowMedia[];
  multiple?: RowValueMultipleDto[];
  range?: RowValueRangeDto | undefined;
};
async function update({
  entity,
  row,
  values,
  rowUpdateInput,
  session,
  checkPermissions = true,
  options,
}: {
  entity: Entity & { properties: PropertyWithDetails[] };
  row: { id: string; entityId: string; tenantId: string | null; values: RowValueWithDetails[] };
  values?: RowValueUpdateDto[];
  rowUpdateInput?: Prisma.RowUpdateInput;
  session: { tenantId: string | null; userId?: string } | undefined;
  checkPermissions?: boolean;
  options?: {
    createLog?: boolean;
  };
}) {
  const dynamicProperties: RowValueDto[] = [];
  await Promise.all(
    (values ?? []).map(async (value) => {
      const property = entity.properties.find((i) => i.name === value.name);
      if (property) {
        let existingProperty: RowValue | null = row.values.find((f) => f.propertyId === property?.id) ?? null;
        if (!existingProperty) {
          existingProperty = await db.rowValue.findFirstOrThrow({ where: { propertyId: property.id, rowId: row.id } }).catch(() => {
            return null;
          });
        }
        if (!existingProperty) {
          existingProperty = await db.rowValue.create({
            data: {
              propertyId: property.id,
              rowId: row.id,
              textValue: value.textValue,
              numberValue: value.numberValue,
              dateValue: value.dateValue,
            },
          });
        }
        dynamicProperties.push({
          id: existingProperty.id,
          property,
          propertyId: property.id,
          textValue: value.textValue,
          numberValue: value.numberValue,
          dateValue: value.dateValue,
          booleanValue: value.booleanValue,
          media: value.media,
          multiple: value.multiple as RowValueMultiple[],
          range: value.range as RowValueRange,
        });
        if (value.textValue !== undefined) {
          existingProperty.textValue = value.textValue;
        }
        if (value.numberValue !== undefined) {
          existingProperty.numberValue = value.numberValue ? new Prisma.Decimal(value.numberValue) : null;
        }
        if (value.dateValue !== undefined) {
          existingProperty.dateValue = value.dateValue;
        }
        if (value.booleanValue !== undefined) {
          existingProperty.booleanValue = value.booleanValue;
        }
      }
    })
  );
  return await RowsApi.update(row.id, {
    entity,
    tenantId: row.tenantId,
    rowValues: {
      dynamicProperties,
    },
    rowUpdateInput,
    userId: session?.userId,
    checkPermissions,
    options,
  });
}

function getText({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): string | undefined {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  return value?.toString();
}
function getBoolean({ entity, row, name }: { entity: Entity & { properties: Property[] }; row: { values: RowValueWithDetails[] }; name: string }): boolean {
  return Boolean(RowHelper.getPropertyValue({ entity, item: row, propertyName: name }));
}
function getNumber({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): number | undefined {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  return value !== undefined && value !== null ? Number(value) : undefined;
}
function getDate({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): Date | undefined {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  if (!value) {
    return undefined;
  }
  return value as Date;
}
function getMedia({ entity, row, name }: { entity: Entity & { properties: Property[] }; row: { values: RowValueWithDetails[] }; name: string }): RowMedia[] {
  const value = (RowHelper.getPropertyValue({ entity, item: row, propertyName: name }) ?? []) as RowMedia[];
  return value;
}
function getFirstMedia({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): RowMedia | undefined {
  const media = getMedia({ entity, row, name });
  const value = media?.length > 0 ? media[0] : undefined;
  return value;
}
function getSelected({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: PropertyWithDetails[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): { value: string; name: string | null; color: number } | undefined {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  if (!value) {
    return undefined;
  }
  const option = entity.properties.find((i) => i.name === name)?.options.find((i) => i.value === value);
  if (option) {
    return { name: option.name, value: option.value, color: option.color };
  } else {
    return { name: null, value: value.toString(), color: 0 };
  }
}
function getMultiple({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): RowValueMultipleDto[] {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  if (!value) {
    return [];
  }
  let multiple = value as RowValueMultiple[];
  return multiple ?? [];
}
function getNumberRange({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): RowValueRangeDto {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  let range = value as RowValueRangeDto;
  if (!range) {
    range = {
      numberMin: null,
      numberMax: null,
      dateMin: null,
      dateMax: null,
    };
  }
  return range;
}
function getDateRange({
  entity,
  row,
  name,
}: {
  entity: Entity & { properties: Property[] };
  row: { values: RowValueWithDetails[] };
  name: string;
}): RowValueRangeDto {
  const value = RowHelper.getPropertyValue({ entity, item: row, propertyName: name });
  let range = value as RowValueRangeDto;
  if (!range) {
    range = {
      numberMin: null,
      numberMax: null,
      dateMin: null,
      dateMax: null,
    };
  }
  return range;
}

export default {
  getText,
  getBoolean,
  getNumber,
  getDate,
  getMedia,
  getFirstMedia,
  getSelected,
  getMultiple,
  getNumberRange,
  getDateRange,
  update,
};
