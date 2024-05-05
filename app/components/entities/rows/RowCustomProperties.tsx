import clsx from "clsx";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import InputCheckboxWithDescription from "~/components/ui/input/InputCheckboxWithDescription";
import InputSelector from "~/components/ui/input/InputSelector";
import InputText from "~/components/ui/input/InputText";
import { EntityWithDetails, PropertyWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";

interface Props {
  entity: EntityWithDetails;
  item?: RowWithDetails | null;
  readOnly?: boolean;
}
export default function RowCustomProperties({ entity, item, readOnly }: Props) {
  return (
    <div className="space-y-2">
      {entity.properties
        .filter((f) => !f.isDynamic)
        .map((prop) => {
          return <RowPropertyValue key={prop.id} entity={entity} property={prop} item={item} readOnly={readOnly} />;
        })}
    </div>
  );
}

function RowPropertyValue({
  entity,
  property,
  item,
  readOnly,
}: {
  entity: EntityWithDetails;
  property: PropertyWithDetails;
  item?: RowWithDetails | null;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Fragment>
      {entity.name === "sampleCustomEntity" && property.name === "customText" ? (
        <InputText
          required={property.isRequired}
          readOnly={readOnly}
          name={property.name}
          title={t(property.title)}
          value={item?.sampleCustomEntity?.customText}
        />
      ) : entity.name === "sampleCustomEntity" && property.name === "customNumber" ? (
        <SampleCustomEntityCustomNumber
          property={property}
          value={item?.sampleCustomEntity?.customNumber !== undefined ? Number(item?.sampleCustomEntity?.customNumber) : undefined}
          readOnly={readOnly}
        />
      ) : entity.name === "sampleCustomEntity" && property.name === "customDate" ? (
        <SampleCustomEntityCustomDate property={property} value={item?.sampleCustomEntity?.customDate} readOnly={readOnly} />
      ) : entity.name === "sampleCustomEntity" && property.name === "customBoolean" ? (
        <SampleCustomEntityCustomBoolean property={property} value={item?.sampleCustomEntity?.customBoolean} readOnly={readOnly} />
      ) : entity.name === "sampleCustomEntity" && property.name === "customSelect" ? (
        <SampleCustomEntityCustomSelect property={property} value={item?.sampleCustomEntity?.customSelect} readOnly={readOnly} />
      ) : (
        <div className="text-xs text-red-500">
          [{entity.name}.{property.name}] field needs to be customized at RowCustomProperties.tsx
        </div>
      )}
    </Fragment>
  );
}

function SampleCustomEntityCustomNumber({ property, value, readOnly }: { property: PropertyWithDetails; readOnly?: boolean; value?: number }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <label htmlFor={property.name} className="flex justify-between space-x-2 text-xs font-medium text-gray-600">
        <div className=" flex items-center space-x-1">
          <div className="truncate">
            {t(property.title)}
            {property.isRequired && <span className="ml-1 text-red-500">*</span>}
          </div>
        </div>
      </label>

      <input
        type="text"
        required={property.isRequired}
        readOnly={readOnly}
        name={property.name}
        title={t(property.title)}
        defaultValue={value}
        className={clsx(
          "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
          readOnly ? "cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 focus:bg-gray-50"
        )}
      />
    </div>
  );
}

function SampleCustomEntityCustomDate({ property, value, readOnly }: { property: PropertyWithDetails; readOnly?: boolean; value?: Date }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <label htmlFor={property.name} className="flex justify-between space-x-2 text-xs font-medium text-gray-600">
        <div className=" flex items-center space-x-1">
          <div className="truncate">
            {t(property.title)}
            {property.isRequired && <span className="ml-1 text-red-500">*</span>}
          </div>
        </div>
      </label>

      <input
        type="date"
        required={property.isRequired}
        readOnly={readOnly}
        name={property.name}
        title={t(property.title)}
        defaultValue={value ? new Date(value).toISOString().split("T")[0] : ""}
        className={clsx(
          "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
          readOnly ? "cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 focus:bg-gray-50"
        )}
      />
    </div>
  );
}

function SampleCustomEntityCustomBoolean({ property, value, readOnly }: { property: PropertyWithDetails; readOnly?: boolean; value?: boolean }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<boolean | undefined>(value);
  return (
    <div className="w-full rounded-md border border-dotted border-gray-300 px-2 py-0">
      <InputCheckboxWithDescription
        name={property.name}
        title={t(property.title)}
        value={checked}
        setValue={(e) => setChecked(e as boolean)}
        disabled={readOnly}
        description="My custom description"
      />
    </div>
  );
}

function SampleCustomEntityCustomSelect({ property, value, readOnly }: { property: PropertyWithDetails; readOnly?: boolean; value?: string }) {
  const { t } = useTranslation();
  const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value);
  return (
    <InputSelector
      withSearch={false}
      withColors={true}
      required={property.isRequired}
      disabled={readOnly}
      name={property.name}
      title={t(property.title)}
      value={selectedValue}
      setValue={setSelectedValue}
      options={[
        { name: "Option 1", value: "option-1", color: Colors.BLUE },
        { name: "Option 2", value: "option-2", color: Colors.RED },
      ]}
    />
  );
}
