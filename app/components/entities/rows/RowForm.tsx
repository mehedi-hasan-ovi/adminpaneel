import { RowWithDetails, RowWithValues } from "~/utils/db/entities/rows.db.server";
import { EntityWithDetails, PropertyWithDetails } from "~/utils/db/entities/entities.db.server";
import { Dispatch, forwardRef, Fragment, ReactNode, Ref, SetStateAction, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { updateItemByIdx } from "~/utils/shared/ObjectUtils";
import { useNavigation, useSubmit } from "@remix-run/react";
import { RowValueDto } from "~/application/dtos/entities/RowValueDto";
import FormGroup from "~/components/ui/forms/FormGroup";
import InputGroup from "~/components/ui/forms/InputGroup";
import RowHelper from "~/utils/helpers/RowHelper";
import RowValueInput, { RefRowValueInput } from "./RowValueInput";
import { LinkedAccountWithDetailsAndMembers } from "~/utils/db/linkedAccounts.db.server";
import PropertyAttributeHelper from "~/utils/helpers/PropertyAttributeHelper";
import { PropertyAttributeName } from "~/application/enums/entities/PropertyAttributeName";
import { useTranslation } from "react-i18next";
import { EntityRelationshipWithDetails } from "~/utils/db/entities/entityRelationships.db.server";
import RowListFetcher from "../../../modules/rows/fetchers/RowListFetcher";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
import { Entity } from "@prisma/client";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import EntityHelper from "~/utils/helpers/EntityHelper";
import RowCustomProperties from "./RowCustomProperties";
import InputSelector from "~/components/ui/input/InputSelector";
import { RowsApi } from "~/utils/api/RowsApi";
import { RowValueMultipleDto } from "~/application/dtos/entities/RowValueMultipleDto";
import RelationshipHelper from "~/utils/helpers/RelationshipHelper";
import RowsList from "./RowsList";
import { EntityViewWithDetails } from "~/utils/db/entities/entityViews.db.server";
import { RowDisplayDefaultProperty } from "~/utils/helpers/PropertyHelper";
import { PropertyType } from "~/application/enums/entities/PropertyType";

export interface RefRowForm {
  create: (index: number) => void;
  close: () => void;
}

interface Props {
  entity: EntityWithDetails;
  allEntities: EntityWithDetails[];
  routes?: EntitiesApi.Routes;
  item?: RowWithDetails | null;
  editing?: boolean;
  adding?: boolean;
  linkedAccounts?: LinkedAccountWithDetailsAndMembers[];
  onSubmit?: (formData: FormData) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canSubmit?: boolean;
  children?: ReactNode;
  parentEntity?: EntityWithDetails;
  onCreatedRedirect?: string;
  onDelete?: () => void;
  relationshipRows?: RowsApi.GetRelationshipRowsData;
  hiddenProperties?: string[];
  hiddenFields?: {
    [key: string]: string | null | undefined;
  };
  state?: { loading?: boolean; submitting?: boolean };
  createdRow?: RowWithDetails;
  onCancel?: () => void;
  onChange?: (values: RowValueDto[]) => void;
}

const RowForm = (
  {
    entity,
    routes,
    item,
    editing = false,
    adding,
    linkedAccounts,
    onSubmit,
    canUpdate,
    canDelete,
    canSubmit = true,
    children,
    parentEntity,
    onCreatedRedirect,
    allEntities,
    onDelete,
    relationshipRows,
    hiddenProperties,
    hiddenFields,
    state,
    createdRow,
    onCancel,
    onChange,
  }: Props,
  ref: Ref<RefRowForm>
) => {
  const { t } = useTranslation();
  const submit = useSubmit();
  const navigation = useNavigation();
  // const params = useParams();
  // const actionData = useActionData<{ newRow?: RowWithDetails }>();

  const [searchingRelationshipRows, setSearchingRelationshipRows] = useState<EntityRelationshipWithDetails>();
  const [selectedRelatedEntity, setSelectedRelatedEntity] = useState<{
    entity: Entity;
    view: EntityViewWithDetails | null;
    multiple: boolean;
  }>();
  const [relatedRows, setRelatedRows] = useState<{ relationship: EntityRelationshipWithDetails; rows: RowWithValues[] }[]>([]);

  const [headers, setHeaders] = useState<RowValueDto[]>([]);

  const [childrenEntities, setChildrenEntities] = useState<{ visible: EntityRelationshipWithDetails[]; hidden: EntityRelationshipWithDetails[] }>({
    visible: [],
    hidden: [],
  });
  const [parentEntities, setParentEntities] = useState<{ visible: EntityRelationshipWithDetails[]; hidden: EntityRelationshipWithDetails[] }>({
    visible: [],
    hidden: [],
  });

  useEffect(() => {
    loadInitialFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  useEffect(() => {
    if (onChange) {
      onChange(headers);
    }
  }, [headers, onChange]);

  // useEffect(() => {
  //   if (headers.length > 0) {
  //     rowValueInput.current?.focus();
  //   }
  // }, [headers])

  // useEffect(() => {
  //   if (actionData?.newRow && onCreated) {
  //     onCreated(actionData.newRow);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [actionData]);

  useEffect(() => {
    if (searchingRelationshipRows?.parentId === entity.id) {
      setSelectedRelatedEntity({
        entity: searchingRelationshipRows.child,
        view: searchingRelationshipRows.childEntityView,
        multiple: true,
      });
    } else if (searchingRelationshipRows?.childId === entity.id) {
      setSelectedRelatedEntity({
        entity: searchingRelationshipRows.parent,
        view: searchingRelationshipRows.parentEntityView,
        multiple: false,
      });
    }
  }, [entity.id, searchingRelationshipRows]);

  function loadInitialFields() {
    const initial: RowValueDto[] = [];
    entity.properties
      ?.filter((f) => isPropertyVisible(f))
      .forEach((property) => {
        const existing = item?.values?.find((f) => f?.propertyId === property.id);

        const defaultValueString = PropertyAttributeHelper.getPropertyAttributeValue_String(property, PropertyAttributeName.DefaultValue);
        const defaultValueNumber = PropertyAttributeHelper.getPropertyAttributeValue_Number(property, PropertyAttributeName.DefaultValue);
        const defaultValueBoolean = PropertyAttributeHelper.getPropertyAttributeValue_Boolean(property, PropertyAttributeName.DefaultValue);
        const selectedOption = existing?.textValue ?? defaultValueString;

        let dateValue = existing?.dateValue ?? undefined;
        // if (property.type === PropertyType.DATE && !dateValue) {
        //   dateValue = new Date();
        // }
        initial.push({
          propertyId: property.id,
          property: property,
          textValue: existing?.textValue ?? defaultValueString ?? undefined,
          numberValue: existing?.numberValue ? Number(existing?.numberValue) : defaultValueNumber,
          dateValue,
          booleanValue: existing?.booleanValue ? Boolean(existing?.booleanValue) : (!existing && defaultValueBoolean) ?? undefined,
          selectedOption,
          media: existing?.media ?? [],
          multiple: existing?.multiple.sort((a: RowValueMultipleDto, b: RowValueMultipleDto) => a.order - b.order) ?? [],
          range: existing?.range ?? undefined,
        });
      });

    const relatedRows: { relationship: EntityRelationshipWithDetails; rows: RowWithValues[] }[] = [];
    if (item) {
      entity.parentEntities.forEach((relationship) => {
        if (item.parentRows?.length > 0) {
          relatedRows.push({
            relationship,
            rows: item.parentRows.filter((f) => f.relationshipId === relationship.id).map((i) => i.parent),
          });
        }
      });
      entity.childEntities.forEach((relationship) => {
        if (item.childRows?.length > 0) {
          relatedRows.push({
            relationship,
            rows: item.childRows.filter((f) => f.relationshipId === relationship.id).map((i) => i.child),
          });
        }
      });
    }

    const allChildren = entity.childEntities.filter((f) => childEntityVisible(f) && allEntities.find((x) => x.id === f.childId));
    setChildrenEntities(getVisibleRelatedEntities(allChildren, relatedRows));
    const allParents = entity.parentEntities.filter((f) => f.parentId !== parentEntity?.id && allEntities.find((x) => x.id === f.parentId));
    setParentEntities(getVisibleRelatedEntities(allParents, relatedRows));

    setHeaders(initial);
    setRelatedRows(relatedRows);
  }

  function onFindEntityRows(relationship: EntityRelationshipWithDetails) {
    if (!routes) {
      return;
    }
    setSearchingRelationshipRows(relationship);
  }

  function addRelationshipRow(relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) {
    const newRelatedRows = [...relatedRows];
    const existing = newRelatedRows.find((f) => f.relationship.id === relationship.id);
    if (existing) {
      if (relationship.parentId === entity.id) {
        const nonExistingRows = rows.filter((f) => !existing.rows.find((ff) => ff.id === f.id));
        existing.rows = [...existing.rows, ...nonExistingRows];
      } else {
        existing.rows = rows;
      }
    } else {
      newRelatedRows.push({ relationship, rows });
    }
    setRelatedRows(newRelatedRows);
  }

  function setRelationshipRows(relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) {
    const newRelatedRows = [...relatedRows];
    const existing = newRelatedRows.find((f) => f.relationship.id === relationship.id);
    if (existing) {
      existing.rows = rows;
    } else {
      newRelatedRows.push({ relationship, rows });
    }
    setRelatedRows(newRelatedRows);
  }

  function onRemoveRelatedRow(relationship: EntityRelationshipWithDetails, row: RowWithValues) {
    const newRelatedRows = [...relatedRows];
    const existing = newRelatedRows.find((f) => f.relationship.id === relationship.id);
    if (existing) {
      existing.rows = existing.rows.filter((f) => f.id !== row.id);
    }
    setRelatedRows(newRelatedRows);
  }

  function submitForm(formData: FormData) {
    if (onCreatedRedirect) {
      formData.set("onCreatedRedirect", onCreatedRedirect);
    }
    if (onSubmit) {
      onSubmit(formData);
    } else {
      submit(formData, {
        method: "post",
      });
    }
  }

  function isPropertyVisible(f: PropertyWithDetails) {
    if (f.isHidden || !f.isDynamic || (!item && !f.showInCreate) || (!item && f.isReadOnly) || (item && editing && f.isReadOnly)) {
      return false;
    } else if (hiddenProperties?.includes(f.name)) {
      return false;
    }
    if (item && editing && !f.canUpdate) {
      return false;
    }

    return true;
  }

  function childEntityVisible(f: EntityRelationshipWithDetails) {
    if (f.readOnly) {
      if (!item) {
        return false;
      }
      if (item && editing) {
        return false;
      }
    }
    return true;
  }

  function canSubmitForm() {
    if (!canSubmit) {
      return false;
    }
    const required = headers.filter((f) => f.property.isRequired);
    let hasError = false;
    required.forEach((f) => {
      if (f.property.type === PropertyType.MEDIA) {
        if (f.media?.length === 0) {
          hasError = true;
        }
      }
    });
    return !hasError;
  }

  function isAddingOrEditing() {
    if (adding) {
      return true;
    }
    if (editing && item && canUpdate && navigation.state === "idle") {
      return true;
    }
    return false;
  }

  return (
    <>
      <FormGroup
        id={item?.id}
        editing={editing}
        canDelete={canDelete}
        onSubmit={submitForm}
        onDelete={onDelete}
        canUpdate={canUpdate}
        canSubmit={canSubmit}
        onCancel={onCancel}
        submitDisabled={!canSubmitForm()}
        onCreatedRedirect={onCreatedRedirect}
        deleteRedirect={EntityHelper.getRoutes({ routes, entity })?.list}
        state={state}
        message={
          createdRow
            ? { success: t("shared.created") + ": " + RowHelper.getTextDescription({ entity, item: createdRow, t, defaultsToFolio: true }) }
            : undefined
        }
      >
        {hiddenFields &&
          Object.keys(hiddenFields).map((f) => {
            return <Fragment key={f}>{hiddenFields[f] && <input type="hidden" name={f} value={hiddenFields[f] ?? ""} hidden readOnly />}</Fragment>;
          })}
        {!onSubmit && (
          <>
            {!item ? (
              <input type="hidden" name="redirect" value={EntityHelper.getRoutes({ routes, entity })?.list} />
            ) : (
              <input type="hidden" name="redirect" value={EntityHelper.getRoutes({ routes, entity, item })?.overview} />
            )}
          </>
        )}
        <RowGroups
          item={item}
          entity={entity}
          rowValues={headers}
          parentEntity={parentEntity}
          allEntities={allEntities}
          relatedRows={relatedRows}
          editing={editing}
          canUpdate={canUpdate}
          routes={routes}
          relationshipRows={relationshipRows}
          setHeaders={setHeaders}
          addRelationshipRow={addRelationshipRow}
          setRelationshipRows={setRelationshipRows}
          onFindEntityRows={onFindEntityRows}
          onRemoveRelatedRow={onRemoveRelatedRow}
          isPropertyVisible={isPropertyVisible}
          children={children}
          canSubmit={canSubmit}
          isAddingOrEditing={isAddingOrEditing()}
          parentEntities={{
            visible: parentEntities.visible,
            hidden: parentEntities.hidden,
            onAddParentEntity: (rel) => {
              setParentEntities((prev) => {
                return {
                  visible: [...prev.visible, rel],
                  hidden: prev.hidden.filter((f) => f.id !== rel.id),
                };
              });
            },
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {childrenEntities.visible.map((relationship) => (
            <div key={relationship.id} className="col-span-12">
              <div className="space-y-2">
                <h3 className="text-sm font-medium leading-3 text-gray-800">
                  <div className="flex items-center space-x-1">
                    <div>
                      <span className=" font-light italic"></span> {t(RelationshipHelper.getTitle({ fromEntityId: entity.id, relationship }))}
                      {/* {relationship.required && <span className="ml-1 text-red-500">*</span>} */}
                    </div>
                  </div>
                </h3>
                <RelationshipSelector
                  fromEntity={entity}
                  type="child"
                  relationship={relationship}
                  relatedRows={relatedRows}
                  onFindEntityRows={onFindEntityRows}
                  allEntities={allEntities}
                  onRemoveRelatedRow={onRemoveRelatedRow}
                  readOnly={item?.id !== undefined && (!editing || !canUpdate || navigation.state !== "idle")}
                  routes={routes}
                  relationshipRows={relationshipRows}
                  addRelationshipRow={addRelationshipRow}
                  setRelationshipRows={setRelationshipRows}
                />
              </div>
            </div>
          ))}

          {isAddingOrEditing() && (
            <AddHiddenRelationshipEntities
              items={childrenEntities.hidden}
              onClick={(rel) => {
                setChildrenEntities((prev) => {
                  return {
                    visible: [...prev.visible, rel],
                    hidden: prev.hidden.filter((f) => f.id !== rel.id),
                  };
                });
              }}
              type="child"
            />
          )}
        </div>

        {relatedRows.map(({ relationship, rows }) => (
          <Fragment key={relationship.id}>
            {rows.map((row) => (
              // <>
              <input
                key={row.id}
                type="hidden"
                readOnly
                hidden
                name={`${relationship.childId === entity.id ? `parents[${relationship.parent.name}]` : `children[${relationship.child.name}]`}`}
                value={row.id}
              />
              // </>
            ))}
          </Fragment>
        ))}
      </FormGroup>
      {/* // <OpenModal className="sm:max-w-4xl" onClose={() => setSearchingRelationshipRows(undefined)}> */}
      <SlideOverWideEmpty
        withTitle={false}
        withClose={false}
        title={t("shared.select")}
        open={searchingRelationshipRows !== undefined}
        onClose={() => setSearchingRelationshipRows(undefined)}
      >
        {selectedRelatedEntity && searchingRelationshipRows && (
          <RowListFetcher
            currentView={selectedRelatedEntity.view}
            listUrl={EntityHelper.getRoutes({ routes, entity: selectedRelatedEntity.entity })?.list ?? ""}
            newUrl={EntityHelper.getRoutes({ routes, entity: selectedRelatedEntity.entity })?.new ?? ""}
            parentEntity={entity}
            onSelected={(rows) => {
              addRelationshipRow(searchingRelationshipRows, rows);
              setSearchingRelationshipRows(undefined);
            }}
            multipleSelection={selectedRelatedEntity.multiple}
            allEntities={allEntities}
          />
        )}
      </SlideOverWideEmpty>
      {/* // </OpenModal> */}
    </>
  );
};

function RelationshipSelector({
  fromEntity,
  routes,
  type,
  relationship,
  relatedRows,
  onFindEntityRows,
  className,
  allEntities,
  onRemoveRelatedRow,
  readOnly,
  relationshipRows,
  addRelationshipRow,
  setRelationshipRows,
}: {
  fromEntity: EntityWithDetails;
  type: "child" | "parent";
  relationship: EntityRelationshipWithDetails;
  relatedRows: { relationship: EntityRelationshipWithDetails; rows: RowWithValues[] }[];
  onFindEntityRows: (relationship: EntityRelationshipWithDetails) => void;
  className?: string;
  allEntities: EntityWithDetails[];
  onRemoveRelatedRow: (relationship: EntityRelationshipWithDetails, row: RowWithValues) => void;
  readOnly: boolean;
  routes?: EntitiesApi.Routes;
  relationshipRows?: RowsApi.GetRelationshipRowsData;
  addRelationshipRow: (relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) => void;
  setRelationshipRows: (relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) => void;
}) {
  const { t } = useTranslation();
  const [entity] = useState(
    type === "parent"
      ? {
          entity: getChildEntity(relationship)!,
          view: relationship.parentEntityView,
        }
      : {
          entity: getParentEntity(relationship)!,
          view: relationship.childEntityView,
        }
  );

  function getRows(relationship: EntityRelationshipWithDetails) {
    const existing = relatedRows.find((f) => f.relationship.id === relationship.id);
    return existing?.rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ?? [];
  }
  function getParentEntity(relationship: EntityRelationshipWithDetails) {
    return allEntities.find((f) => f.id === relationship.childId);
  }
  function getChildEntity(relationship: EntityRelationshipWithDetails) {
    return allEntities.find((f) => f.id === relationship.parentId);
  }
  function getSelectedRow() {
    const rows = getRows(relationship);
    if (rows.length > 0) {
      return rows[0].id;
    }
    return undefined;
  }
  function getOptions() {
    return (
      relationshipRows
        ?.find((f) => f.relationship.id === relationship.id)
        ?.rows.map((f) => {
          return { value: f.id, name: RowHelper.getTextDescription({ entity: entity.entity, item: f, t }) };
        }) ?? []
    );
  }
  return (
    <div className={className}>
      {/* <div>selectedRow: {getSelectedRow()}</div>
      <div>
        options:{" "}
        {getOptions()
          .map((f) => f.value)
          .join(",")}
      </div>
      <div>
        {relatedRows.filter((f) => f.relationship.id === relationship.id).length > 0 &&
          relatedRows
            .filter((f) => f.relationship.id === relationship.id)[0]
            .rows.map((f) => f.id)
            .join(",")}
      </div> */}
      {/* {RelationshipHelper.getInputType({ fromEntityId: fromEntity.id, relationship }) === "single-select" ? (
        <InputSelector
          className="mt-1"
          name={relationship.parent.name}
          disabled={readOnly}
          value={getSelectedRow()}
          options={getOptions()}
          setValue={(value) => {
            const row = relationshipRows?.find((f) => f.relationship.id === relationship.id)?.rows.find((f) => f.id === value);
            if (row) {
              setRelationshipRows(relationship, [row]);
            }
          }}
        />
      ) : RelationshipHelper.getInputType({ fromEntityId: fromEntity.id, relationship }) === "multi-select" ? (
        <> */}
      {getRows(relationship).length === 0 ? (
        <button
          onClick={() => onFindEntityRows(relationship)}
          type="button"
          disabled={readOnly}
          className={clsx(
            "relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center",
            readOnly ? "cursor-not-allowed bg-gray-100" : "bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          )}
        >
          <span className="flex items-center space-x-1 text-xs font-normal text-gray-500">
            {readOnly ? (
              <div>{t("shared.notSet")}</div>
            ) : (
              <>
                {type === "parent" && (
                  <>
                    <div>{t("shared.select")}</div>
                    <div className="lowercase">{t(relationship.parent.title)}</div>
                  </>
                )}
                {type === "child" && (
                  <>
                    <div>{t("shared.add")}</div>
                    <div className="lowercase">{t(relationship.child.title)}</div>
                  </>
                )}
              </>
            )}
          </span>
        </button>
      ) : (
        <div className="relative space-y-2 overflow-visible">
          <RowsList
            entity={entity.entity}
            items={getRows(relationship) as RowWithDetails[]}
            currentView={entity.view}
            view={(entity.view?.layout ?? "card") as "table" | "board" | "grid" | "card"}
            readOnly={readOnly}
            onRemove={readOnly ? undefined : (row) => onRemoveRelatedRow(relationship, row)}
            ignoreColumns={!readOnly ? [RowDisplayDefaultProperty.FOLIO, "parent." + relationship.parent.name, "child." + relationship.child.name] : []}
          />
          {/* {getRows(relationship).map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "group relative w-full overflow-visible truncate rounded-md border border-gray-300 px-4 py-3 text-left text-sm",
                    !readOnly ? "bg-white hover:border-gray-500" : "bg-gray-100"
                  )}
                >
                  <button
                    onClick={() => onRemoveRelatedRow(relationship, item)}
                    type="button"
                    disabled={readOnly}
                    className={clsx(
                      "absolute right-0 top-0 mr-2 mt-2 hidden origin-top-right justify-center rounded-full bg-white text-gray-600",
                      readOnly ? "cursor-not-allowed" : "hover:text-red-500 group-hover:flex"
                    )}
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-2 gap-1">
                    <div>{RowHelper.getTextDescription({ entity, item, t, defaultsToFolio: true })}</div>
                  </div>
                </div>
              ))} */}
          <button
            onClick={() => onFindEntityRows(relationship)}
            type="button"
            className={clsx(
              "relative flex space-x-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-center text-xs text-gray-600 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500",
              readOnly && "hidden"
            )}
          >
            {type === "parent" && (
              <>
                <div>{t("shared.select")}</div>
                <div className="lowercase">{t(relationship.parent.title)}</div>
              </>
            )}
            {type === "child" && (
              <>
                <div>{t("shared.add")}</div>
                <div className="lowercase">{t(relationship.child.title)}</div>
              </>
            )}
          </button>
        </div>
      )}
      {/* </>
      ) : null} */}
    </div>
  );
}

function RowGroups({
  item,
  entity,
  rowValues,
  parentEntity,
  allEntities,
  relatedRows,
  editing,
  canUpdate,
  routes,
  relationshipRows,
  setHeaders,
  addRelationshipRow,
  setRelationshipRows,
  onFindEntityRows,
  onRemoveRelatedRow,
  isPropertyVisible,
  children,
  canSubmit,
  isAddingOrEditing,
  parentEntities,
}: {
  item?: RowWithDetails | null;
  entity: EntityWithDetails;
  rowValues: RowValueDto[];
  parentEntity?: EntityWithDetails;
  allEntities: EntityWithDetails[];
  relatedRows: { relationship: EntityRelationshipWithDetails; rows: RowWithValues[] }[];
  editing?: boolean;
  canUpdate?: boolean;
  routes?: EntitiesApi.Routes;
  relationshipRows?: RowsApi.GetRelationshipRowsData;
  setHeaders: Dispatch<SetStateAction<RowValueDto[]>>;
  addRelationshipRow: (relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) => void;
  setRelationshipRows: (relationship: EntityRelationshipWithDetails, rows: RowWithDetails[]) => void;
  onFindEntityRows: (relationship: EntityRelationshipWithDetails) => void;
  onRemoveRelatedRow: (relationship: EntityRelationshipWithDetails, row: RowWithValues) => void;
  isPropertyVisible: (property: PropertyWithDetails) => boolean;
  children?: ReactNode;
  canSubmit?: boolean;
  isAddingOrEditing: boolean;
  parentEntities: {
    visible: EntityRelationshipWithDetails[];
    hidden: EntityRelationshipWithDetails[];
    onAddParentEntity: (item: EntityRelationshipWithDetails) => void;
  };
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const rowValueInput = useRef<RefRowValueInput>(null);

  const [groups, setGroups] = useState<{ group?: string; headers: RowValueDto[] }[]>([]);

  useEffect(() => {
    const groups: { group?: string; headers: RowValueDto[] }[] = [];
    rowValues.forEach((header) => {
      const groupName = PropertyAttributeHelper.getPropertyAttributeValue_String(header.property, PropertyAttributeName.Group);
      let found = groups.find((f) => f.group === groupName);
      if (!found) {
        found = groups.find((f) => !f.group && !groupName);
      }
      if (found) {
        found.headers.push(header);
      } else {
        groups.push({
          group: groupName,
          headers: [header],
        });
      }
    });
    if (groups.length === 0) {
      groups.push({ headers: rowValues });
    }
    setGroups(groups);
  }, [groups.length, rowValues]);

  function getPropertyColumnSpan(property: PropertyWithDetails) {
    const columns = PropertyAttributeHelper.getPropertyAttributeValue_Number(property, PropertyAttributeName.Columns);
    if (columns === undefined) {
      return "col-span-12";
    }
    return `col-span-${columns}`;
  }
  return (
    <>
      {groups.map(({ group, headers }, idx) => {
        return (
          <InputGroup key={idx} title={group ? t(group) : t("shared.details")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              {headers.map((detailValue, idxDetailValue) => {
                return (
                  <div key={idxDetailValue} className={clsx("w-full", getPropertyColumnSpan(detailValue.property))}>
                    <RowValueInput
                      ref={rowValueInput}
                      entity={entity}
                      textValue={headers[idxDetailValue].textValue}
                      numberValue={headers[idxDetailValue].numberValue}
                      dateValue={headers[idxDetailValue].dateValue}
                      booleanValue={headers[idxDetailValue].booleanValue}
                      multiple={headers[idxDetailValue].multiple}
                      range={headers[idxDetailValue].range}
                      initialOption={detailValue.selectedOption}
                      selected={detailValue.property}
                      initialMedia={detailValue.media}
                      onChange={(e) => {
                        updateItemByIdx(headers, setHeaders, idxDetailValue, RowHelper.updateFieldValueTypeArray(headers[idxDetailValue], e));
                      }}
                      onChangeOption={(e) => {
                        updateItemByIdx(headers, setHeaders, idxDetailValue, {
                          textValue: e,
                          selectedOption: e,
                        });
                      }}
                      onChangeMedia={(media) => {
                        updateItemByIdx(headers, setHeaders, idxDetailValue, {
                          media,
                        });
                      }}
                      onChangeMultiple={(e) => {
                        updateItemByIdx(headers, setHeaders, idxDetailValue, {
                          multiple: e,
                        });
                      }}
                      onChangeRange={(e) => {
                        updateItemByIdx(headers, setHeaders, idxDetailValue, {
                          range: e,
                        });
                      }}
                      readOnly={
                        (editing && !detailValue.property.canUpdate) ||
                        (item?.id !== undefined && (!editing || !canUpdate || navigation.state !== "idle")) ||
                        detailValue.property?.isReadOnly
                      }
                      autoFocus={idx === 0 && idxDetailValue === 0 && canSubmit}
                    />
                  </div>
                );
              })}
              {/* Show parent entities in Default Properties Group */}
              {!group && (
                <>
                  {parentEntities.visible.map((relationship) => (
                    <div key={relationship.id} className="col-span-12">
                      <label htmlFor={relationship.id} className="flex justify-between space-x-2 text-xs font-medium text-gray-600 ">
                        <div className=" flex items-center space-x-1">
                          <div className="truncate">
                            {t(RelationshipHelper.getTitle({ fromEntityId: entity.id, relationship }))}
                            {relationship.required && <span className="ml-1 text-red-500">*</span>}
                          </div>
                        </div>
                      </label>
                      <RelationshipSelector
                        fromEntity={entity}
                        className="mt-1"
                        type="parent"
                        relationship={relationship}
                        relatedRows={relatedRows}
                        onFindEntityRows={onFindEntityRows}
                        allEntities={allEntities}
                        onRemoveRelatedRow={onRemoveRelatedRow}
                        readOnly={item?.id !== undefined && (!editing || !canUpdate)}
                        routes={routes}
                        relationshipRows={relationshipRows}
                        addRelationshipRow={addRelationshipRow}
                        setRelationshipRows={setRelationshipRows}
                      />
                    </div>
                  ))}

                  {isAddingOrEditing && (
                    <AddHiddenRelationshipEntities items={parentEntities.hidden} onClick={parentEntities.onAddParentEntity} type="parent" />
                  )}
                </>
              )}
              {/* Show custom properties in Default Properties Group */}
              {!group && (
                <>
                  <div className="col-span-12">
                    <RowCustomProperties
                      entity={entity}
                      item={item}
                      readOnly={item?.id !== undefined && (!editing || !canUpdate || navigation.state !== "idle")}
                    />
                  </div>

                  {children}
                </>
              )}
            </div>
          </InputGroup>
        );
      })}
    </>
  );
}

function AddHiddenRelationshipEntities({
  items,
  onClick,
  type,
}: {
  items: EntityRelationshipWithDetails[];
  onClick: (item: EntityRelationshipWithDetails) => void;
  type: "parent" | "child";
}) {
  const { t } = useTranslation();
  return (
    <Fragment>
      {items.length > 0 && (
        <div className="col-span-12 flex flex-wrap items-center">
          {items.map((relationship) => (
            <button
              type="button"
              onClick={() => onClick(relationship)}
              className=" m-0.5 w-auto rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              {t("shared.add")} {type === "parent" ? t(relationship.parent.title) : t(relationship.child.title)}
            </button>
          ))}
        </div>
      )}
    </Fragment>
  );
}

function getVisibleRelatedEntities(
  entityRelationships: EntityRelationshipWithDetails[],
  relatedRows: { relationship: EntityRelationshipWithDetails; rows: RowWithValues[] }[]
) {
  const visible = entityRelationships.filter((f) => !f.hiddenIfEmpty);
  const hidden: EntityRelationshipWithDetails[] = [];

  entityRelationships
    .filter((f) => f.hiddenIfEmpty)
    .forEach((relationship) => {
      const rows = relatedRows.filter((f) => f.relationship.id === relationship.id).flatMap((f) => f.rows);
      if (rows.length > 0) {
        visible.push(relationship);
      } else {
        hidden.push(relationship);
      }
    });

  return {
    visible,
    hidden,
  };
}

export default forwardRef(RowForm);
