import RowsListAndTable from "./RowsListAndTable";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { EntityWithDetails, PropertyWithDetails } from "~/utils/db/entities/entities.db.server";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { ColumnDto } from "~/application/dtos/data/ColumnDto";
import KanbanSimple, { KanbanColumn } from "~/components/ui/lists/KanbanSimple";
import RowHelper from "~/utils/helpers/RowHelper";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import RowCard from "./RowCard";
import { Fragment, useEffect, useState } from "react";
import { Link, useSearchParams } from "@remix-run/react";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import GridContainer from "~/components/ui/lists/GridContainer";
import { EntityViewWithDetails } from "~/utils/db/entities/entityViews.db.server";
import Constants from "~/application/Constants";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import clsx from "clsx";
import EntityViewHelper from "~/utils/helpers/EntityViewHelper";
import RowColumnsHelper from "~/utils/helpers/RowColumnsHelper";
import { PropertyType } from "~/application/enums/entities/PropertyType";

interface Props {
  view: "table" | "board" | "grid" | "card";
  items: RowWithDetails[];
  routes?: EntitiesApi.Routes;
  pagination?: PaginationDto;
  onEditRow?: (row: RowWithDetails) => void;
  currentView?: EntityViewWithDetails | null;
  selectedRows?: RowWithDetails[];
  onSelected?: (item: RowWithDetails[]) => void;
  readOnly?: boolean;
  onClickRoute?: (row: RowWithDetails) => string;
  onRemove?: (row: RowWithDetails) => void;
  ignoreColumns?: string[];
  columns?: ColumnDto[];
}
export default function RowsList(props: Props & { entity: EntityWithDetails | string }) {
  const appOrAdminData = useAppOrAdminData();

  const [entity, setEntity] = useState<EntityWithDetails>();
  const [columns, setColumns] = useState<ColumnDto[]>([]);
  const [groupBy, setGroupBy] = useState<{ workflowStates?: boolean; property?: PropertyWithDetails } | undefined>();

  useEffect(() => {
    let entity: EntityWithDetails | undefined = undefined;
    let columns: ColumnDto[] = [];
    let groupBy: { workflowStates?: boolean; property?: PropertyWithDetails } | undefined = undefined;

    if (typeof props.entity === "string") {
      entity = appOrAdminData.entities.find((e) => e.name === props.entity);
    } else {
      entity = props.entity;
    }

    if (entity) {
      if (!props.currentView) {
        columns = RowColumnsHelper.getDefaultEntityColumns(entity);
        if (props.view === "board") {
          columns = columns.filter((f) => f.name !== groupBy?.property?.name);
        }
        if (props.ignoreColumns) {
          columns = columns.filter((f) => !props.ignoreColumns?.includes(f.name));
        }

        if (props.view === "board") {
          if (entity.workflowStates.length > 0 && entity.hasWorkflow) {
            groupBy = { workflowStates: true };
          } else {
            const property = entity.properties.find((f) => f.type === PropertyType.SELECT && !f.isHidden);
            if (property) {
              groupBy = { property };
            }
          }
        }
      } else {
        columns = props.currentView.properties
          .sort((a, b) => a.order - b.order)
          .map((f) => {
            return { name: f.name ?? "", title: "", visible: true };
          });
        if (props.ignoreColumns) {
          columns = columns.filter((f) => !props.ignoreColumns?.includes(f.name));
        }

        if (props.currentView.layout === "board") {
          columns = columns.filter((f) => f.name !== groupBy?.property?.name);
        }

        if (props.currentView.groupByWorkflowStates) {
          groupBy = { workflowStates: true };
        } else if (props.currentView.groupByPropertyId) {
          const property = entity.properties.find((f) => f.id === props.currentView?.groupByPropertyId);
          if (property) {
            groupBy = { property };
          }
        }
      }
    }

    // if (props.readOnly) {
    //   columns = columns.filter((f) => ![RowDisplayDefaultProperty.FOLIO.toString()].includes(f.name));
    // }

    if (props.columns !== undefined) {
      columns = props.columns;
    }

    setEntity(entity);
    setColumns(columns);
    setGroupBy(groupBy);
  }, [appOrAdminData.entities, props]);

  if (!entity) {
    return null;
  } else if (columns.length === 0) {
    return null;
  }

  return <RowsListWrapped {...props} entity={entity} columns={columns} groupBy={groupBy} />;
}

function RowsListWrapped({
  view,
  entity,
  items,
  routes,
  columns,
  pagination,
  groupBy,
  onEditRow,
  currentView,
  selectedRows,
  onSelected,
  readOnly,
  onClickRoute,
  onRemove,
}: Props & {
  entity: EntityWithDetails;
  columns: ColumnDto[];
  groupBy?: { workflowStates?: boolean; property?: PropertyWithDetails };
}) {
  const { t } = useTranslation();
  const appOrAdminData = useAppOrAdminData();

  const [options, setOptions] = useState<KanbanColumn<RowWithDetails>[]>([]);
  useEffect(() => {
    if (groupBy?.workflowStates) {
      setOptions(
        entity.workflowStates.map((option) => {
          return {
            name: option.id,
            color: option.color,
            title: (
              <div className="flex items-center space-x-1">
                <div className="font-bold">{t(option.title)}</div>
              </div>
            ),
            value: (item: RowWithDetails) => (
              <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
            ),
            onClickRoute: (i: RowWithDetails) => EntityHelper.getRoutes({ routes, entity, item: i })?.edit ?? "",
          };
        })
      );
    } else if (groupBy?.property) {
      setOptions(
        groupBy.property.options.map((option) => {
          return {
            name: option.value,
            color: option.color,
            title: (
              <div className="flex items-center space-x-1">
                {option.name ? <div className="font-bold">{option.name}</div> : <div className="font-bold">{option.value}</div>}
              </div>
            ),
            value: (item: RowWithDetails) => (
              <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
            ),
            onClickRoute: (i: RowWithDetails) => EntityHelper.getRoutes({ routes, entity, item: i })?.edit ?? "",
            onNewRoute: (columnValue: string) => {
              let newRoute = EntityHelper.getRoutes({ routes, entity })?.new;
              if (newRoute) {
                return newRoute + `?${groupBy?.property?.name}=${columnValue}`;
              }
              return "";
            },
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  return (
    <Fragment>
      {view == "table" && (
        <RowsListAndTable
          columns={columns}
          entity={entity}
          items={items}
          pagination={pagination}
          routes={routes}
          onFolioClick={onEditRow}
          onEditClick={onEditRow}
          onRelatedRowClick={onEditRow}
          allEntities={appOrAdminData.entities}
          editable={!readOnly}
          selectedRows={selectedRows}
          onSelected={onSelected}
          onRemove={onRemove}
        />
      )}
      {view === "board" && groupBy && (
        <KanbanSimple
          className="pt-2"
          items={items}
          classNameWidth={clsx("")}
          filterValue={(item, column) => {
            if (groupBy.workflowStates) {
              if (column === null) {
                return !item.workflowStateId;
              }
              return item.workflowStateId === column?.name;
            } else if (groupBy.property) {
              const value = RowHelper.getPropertyValue({ entity, item, property: groupBy.property });
              if (column === null && !value) {
                return true;
              }
              return value === column?.name;
            }
            return false;
          }}
          columns={options}
          undefinedColumn={{
            name: t("shared.undefined"),
            color: Colors.UNDEFINED,
            title: (
              <div className="flex items-center space-x-1">
                <div className="font-bold">{t("shared.undefined")}</div>
              </div>
            ),
            value: (item: RowWithDetails) => {
              return (
                <div className="rounded-md bg-white">
                  <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
                </div>
              );
            },
            onClickRoute: (i: RowWithDetails) => EntityHelper.getRoutes({ routes, entity, item: i })?.edit ?? "",
          }}
          column={groupBy.workflowStates ? "workflowStateId" : groupBy.property?.name ?? ""}
          renderEmpty={<EmptyCard className="w-full" />}
        />
      )}
      {view === "grid" && (
        <div className="space-y-2">
          {/* {pagination && (
            <GridPagination
              defaultPageSize={currentView?.pageSize ?? undefined}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              page={pagination.page}
              pageSize={pagination.pageSize}
            />
          )} */}
          <GridContainer {...(currentView ? EntityViewHelper.getGridLayout(currentView) : { columns: 3, gap: "xs" })}>
            {items.map((item) => {
              const href = onClickRoute ? onClickRoute(item) : EntityHelper.getRoutes({ routes, entity, item })?.overview ?? undefined;
              if (onSelected && selectedRows !== undefined) {
                return (
                  <ButtonSelectWrapper key={item.id} item={item} onSelected={onSelected} selectedRows={selectedRows}>
                    <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
                  </ButtonSelectWrapper>
                );
              }
              const card = (
                <div className={clsx("group relative rounded-md bg-white text-left", href && "hover:bg-gray-50")}>
                  <RemoveButton item={item} readOnly={readOnly} onRemove={onRemove} />
                  <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
                </div>
              );
              return href ? (
                <Link key={item.id} to={href}>
                  {card}
                </Link>
              ) : (
                card
              );
              // return (
              //   <Fragment key={item.id}>
              //     <Link to={item.id}>
              //       <div className="group w-full truncate rounded-md border border-gray-300 bg-white p-3 text-left shadow-sm hover:bg-gray-50">
              //         <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
              //       </div>
              //     </Link>
              //   </Fragment>
              // );
            })}
            {items.length === 0 ? (
              <Fragment>{readOnly ? <EmptyCard className="w-full" /> : <AddMoreCard entity={entity} routes={routes} />}</Fragment>
            ) : (
              <Fragment>
                <LoadMoreCard pagination={pagination} currentView={currentView} />
              </Fragment>
            )}
          </GridContainer>
        </div>
      )}
      {view === "card" && (
        <div className="flex space-x-2 overflow-x-scroll">
          {items.map((item) => {
            let className = clsx("w-64");
            if (onSelected && selectedRows !== undefined) {
              return (
                <ButtonSelectWrapper className={clsx("group relative")} key={item.id} item={item} onSelected={onSelected} selectedRows={selectedRows}>
                  <div className={className}>
                    <RemoveButton item={item} readOnly={readOnly} onRemove={onRemove} />
                    <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
                  </div>
                </ButtonSelectWrapper>
              );
            }
            const href = onClickRoute ? onClickRoute(item) : EntityHelper.getRoutes({ routes, entity, item })?.overview ?? undefined;
            const card = (
              <div className={clsx(className, "group relative rounded-md text-left", href && "hover:bg-gray-50")}>
                <div className={className}>
                  <RemoveButton item={item} readOnly={readOnly} onRemove={onRemove} />
                  <RenderCard layout={view} item={item} entity={entity} columns={columns} allEntities={appOrAdminData.entities} routes={routes} />
                </div>
              </div>
            );
            return href ? (
              <Link key={item.id} to={href}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
          {items.length === 0 ? (
            <Fragment>{readOnly ? <EmptyCard className="w-full" /> : <AddMoreCard className="w-64" entity={entity} routes={routes} />}</Fragment>
          ) : (
            <Fragment>
              {!readOnly && <AddMoreCard className="w-64" entity={entity} routes={routes} />}
              <LoadMoreCard className="w-64" pagination={pagination} currentView={currentView} />
            </Fragment>
          )}
        </div>
      )}
    </Fragment>
  );
}

function LoadMoreCard({ pagination, currentView, className }: { pagination?: PaginationDto; currentView?: EntityViewWithDetails | null; className?: string }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  function theresMore() {
    if (!pagination) {
      return false;
    }
    return pagination.totalItems > pagination.page * pagination.pageSize;
  }
  return (
    <Fragment>
      {theresMore() && (
        <div className={className}>
          <button
            type="button"
            className="group inline-block h-full w-full truncate rounded-md border-2 border-dashed border-slate-200 p-4 text-left align-middle shadow-sm hover:border-dotted hover:border-slate-300 hover:bg-slate-100"
            onClick={() => {
              if (!pagination) {
                return;
              }
              let currentPageSize = 0;
              const paramsPageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize") ?? "") : undefined;
              if (paramsPageSize) {
                currentPageSize = paramsPageSize;
              } else {
                currentPageSize = pagination.pageSize;
              }
              let currentViewPageSize = currentView ? currentView.pageSize : 0;
              if (currentViewPageSize === 0) {
                currentViewPageSize = Constants.DEFAULT_PAGE_SIZE;
              }
              const pageSize = currentPageSize + currentViewPageSize;
              searchParams.set("pageSize", pageSize.toString());
              setSearchParams(searchParams);
            }}
          >
            <div className="mx-auto flex justify-center text-center align-middle text-sm font-medium text-gray-700">{t("shared.loadMore")}</div>
          </button>
        </div>
      )}
    </Fragment>
  );
}

function AddMoreCard({ entity, routes, className }: { entity: EntityWithDetails; routes?: EntitiesApi.Routes; className?: string }) {
  const { t } = useTranslation();
  return (
    <Fragment>
      <div className={className}>
        {routes && (
          <Link
            className={clsx(
              "group flex h-full items-center rounded-md border-2 border-dashed border-slate-200 text-left align-middle shadow-sm hover:border-dotted hover:border-slate-300 hover:bg-slate-100",
              className
            )}
            to={EntityHelper.getRoutes({ routes, entity })?.new ?? ""}
          >
            <div className="mx-auto flex justify-center text-center align-middle text-sm font-medium text-gray-700">{t("shared.add")}</div>
          </Link>
        )}
      </div>
    </Fragment>
  );
}

function EmptyCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Fragment>
      <div className={className}>
        <div className="group inline-block h-full w-full truncate rounded-md border-2 border-dashed border-slate-300 bg-white p-12 text-left align-middle shadow-sm">
          <div className="mx-auto flex justify-center text-center align-middle text-sm font-medium text-gray-700">{t("shared.noRecords")}</div>
        </div>
      </div>
    </Fragment>
  );
}

function ButtonSelectWrapper({
  item,
  onSelected,
  selectedRows,
  children,
  className,
}: {
  item: RowWithDetails;
  selectedRows: RowWithDetails[];
  onSelected: (item: RowWithDetails[]) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isSelected = selectedRows.find((f) => f.id === item.id);
  return (
    <div className={clsx(className, "group relative rounded-md text-left", isSelected ? "bg-theme-50 hover:bg-theme-50" : "bg-white hover:bg-gray-50")}>
      <button
        type="button"
        className="absolute right-0 top-0 mr-2 mt-2 origin-top-right justify-center"
        onClick={() => {
          if (isSelected) {
            onSelected(selectedRows.filter((f) => f.id !== item.id));
          } else {
            onSelected([...(selectedRows ?? []), item]);
          }
        }}
      >
        {isSelected ? (
          <svg
            fill="currentColor"
            className="h-5 w-5 text-teal-700"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="50"
            height="50"
            viewBox="0 0 50 50"
          >
            <path d="M 39 4 L 11 4 C 7.140625 4 4 7.140625 4 11 L 4 39 C 4 42.859375 7.140625 46 11 46 L 39 46 C 42.859375 46 46 42.859375 46 39 L 46 11 C 46 7.140625 42.859375 4 39 4 Z M 23.085938 34.445313 L 13.417969 25.433594 L 14.78125 23.96875 L 22.914063 31.554688 L 36.238281 15.832031 L 37.761719 17.125 Z"></path>
          </svg>
        ) : (
          <svg
            fill="currentColor"
            className="h-5 w-5 text-teal-700"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="50"
            height="50"
            viewBox="0 0 50 50"
          >
            <path d="M 39 4 L 11 4 C 7.101563 4 4 7.101563 4 11 L 4 39 C 4 42.898438 7.101563 46 11 46 L 39 46 C 42.898438 46 46 42.898438 46 39 L 46 11 C 46 7.101563 42.898438 4 39 4 Z M 42 39 C 42 40.699219 40.699219 42 39 42 L 11 42 C 9.300781 42 8 40.699219 8 39 L 8 11 C 8 9.300781 9.300781 8 11 8 L 39 8 C 40.699219 8 42 9.300781 42 11 Z"></path>
          </svg>
        )}
      </button>
      {children}
    </div>
  );
}

function RemoveButton({ item, readOnly, onRemove }: { item: RowWithDetails; readOnly?: boolean; onRemove?: (item: RowWithDetails) => void }) {
  return (
    <Fragment>
      {onRemove && (
        <button
          onClick={() => onRemove(item)}
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
      )}
    </Fragment>
  );
}

function RenderCard({
  layout,
  item,
  entity,
  columns,
  allEntities,
  routes,
}: {
  layout: "table" | "grid" | "board" | "card";
  item: RowWithDetails;
  entity: EntityWithDetails;
  columns: ColumnDto[];
  allEntities: EntityWithDetails[];
  routes: EntitiesApi.Routes | undefined;
}) {
  return (
    <div className="rounded-md border border-gray-300 bg-white p-3 shadow-sm">
      <RowCard layout={layout} item={item} entity={entity} columns={columns} allEntities={allEntities} routes={routes} />
    </div>
  );
}
