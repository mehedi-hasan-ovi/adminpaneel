import { EntityWithDetails, PropertyWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowValueWithDetails, RowWithDetails } from "~/utils/db/entities/rows.db.server";
import RowValueInput from "./RowValueInput";
import clsx from "clsx";
import PropertyAttributeHelper from "~/utils/helpers/PropertyAttributeHelper";
import { PropertyAttributeName } from "~/application/enums/entities/PropertyAttributeName";
import { useEffect, useState } from "react";

export default function RowProperties({
  entity,
  item,
  readOnly,
  properties,
  gridColumns,
}: {
  entity: EntityWithDetails;
  item: RowWithDetails | null;
  readOnly?: boolean;
  properties?: string[];
  gridColumns?: "grid-cols-4" | "grid-cols-3" | "grid-cols-2";
}) {
  const [values, setValues] = useState<RowValueWithDetails[]>([]);

  useEffect(() => {
    setValues(item?.values ?? []);
  }, [entity, item]);

  function getPropertyColumnSpan(property: PropertyWithDetails) {
    const columns = PropertyAttributeHelper.getPropertyAttributeValue_Number(property, PropertyAttributeName.Columns);
    if (columns === undefined) {
      return "col-span-12";
    }
    return `col-span-${columns}`;
  }
  function getValue(property: PropertyWithDetails) {
    return values.find((f) => f.propertyId === property.id);
  }
  function getInitialOption(property: PropertyWithDetails) {
    const defaultValueString = PropertyAttributeHelper.getPropertyAttributeValue_String(property, PropertyAttributeName.DefaultValue);
    const textValue = getValue(property)?.textValue;
    const selectedOption = property.options?.find((f) => f.value === (textValue ?? defaultValueString));
    return selectedOption?.value;
  }
  return (
    <div className={clsx("grid gap-2", gridColumns)}>
      {entity.properties
        .filter((f) => !f.isDefault && !f.isHidden && (properties === undefined || properties.includes(f.name)))
        .map((prop) => {
          return (
            <div key={prop.id} className={clsx("w-full", !gridColumns && getPropertyColumnSpan(prop))}>
              {/* {prop.type === PropertyType.MULTI_SELECT && <>multiple: {JSON.stringify(getValue(prop)?.multiple)}</>} */}
              <RowValueInput
                entity={entity}
                textValue={getValue(prop)?.textValue ?? ""}
                numberValue={getValue(prop)?.numberValue ? Number(getValue(prop)?.numberValue) : undefined}
                dateValue={getValue(prop)?.dateValue ? new Date(getValue(prop)?.dateValue ?? "") : undefined}
                booleanValue={getValue(prop)?.booleanValue ?? false}
                multiple={getValue(prop)?.multiple ?? []}
                range={getValue(prop)?.range ?? undefined}
                selected={prop}
                initialMedia={getValue(prop)?.media ?? []}
                onChange={(e) => {
                  // updateItemByIdx(headers, setHeaders, idx, RowHelper.updateFieldValueTypeArray(headers[idx], e));
                }}
                initialOption={getInitialOption(prop)}
                // onChangeOption={(e) => {
                //   updateItemByIdx(headers, setHeaders, idx, {
                //     textValue: e?.value,
                //     selectedOption: e,
                //   });
                // }}
                // onChangeMedia={(media) => {
                //   updateItemByIdx(headers, setHeaders, idx, {
                //     media,
                //   });
                // }}
                // onChangeMultiple={(e) => {
                //   updateItemByIdx(headers, setHeaders, idx, {
                //     multiple: e,
                //   });
                // }}
                // onChangeRange={(e) => {
                //   updateItemByIdx(headers, setHeaders, idx, {
                //     range: e,
                //   });
                // }}
                readOnly={readOnly || prop?.isReadOnly}
              />
            </div>
          );
        })}
    </div>
  );
}
