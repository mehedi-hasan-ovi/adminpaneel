import { useTranslation } from "react-i18next";
import { Fragment, useEffect, useState } from "react";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import TableSimple from "~/components/ui/tables/TableSimple";
import { RowHeaderDisplayDto } from "~/application/dtos/data/RowHeaderDisplayDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { ColumnDto } from "~/application/dtos/data/ColumnDto";
import RowDisplayHeaderHelper from "~/utils/helpers/RowDisplayHeaderHelper";
import { RowHeaderActionDto } from "~/application/dtos/data/RowHeaderActionDto";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import EntityHelper from "~/utils/helpers/EntityHelper";
import TrashIcon from "~/components/ui/icons/TrashIcon";
import clsx from "clsx";
import RowHelper from "~/utils/helpers/RowHelper";
import FolderIconFilled from "~/components/ui/icons/entities/FolderIconFilled";
import { Link } from "@remix-run/react";
import PencilIcon from "~/components/ui/icons/PencilIcon";
import { EntityRelationshipWithDetails } from "~/utils/db/entities/entityRelationships.db.server";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";

interface Props {
  entity: EntityWithDetails;
  items: RowWithDetails[];
  routes?: EntitiesApi.Routes;
  columns?: ColumnDto[];
  pagination?: PaginationDto;
  className?: string;
  editable?: boolean;
  selectedRows?: RowWithDetails[];
  onSelected?: (item: RowWithDetails[]) => void;
  onFolioClick?: (item: RowWithDetails) => void;
  onEditClick?: (item: RowWithDetails) => void;
  onRelatedRowClick?: (item: RowWithDetails) => void;
  leftHeaders?: RowHeaderDisplayDto<RowWithDetails>[];
  rightHeaders?: RowHeaderDisplayDto<RowWithDetails>[];
  allEntities: EntityWithDetails[];
  onRemove?: (item: RowWithDetails) => void;
}

export default function RowsNestedLayout({
  entity,
  routes,
  items,
  pagination,
  className = "",
  columns,
  editable = true,
  selectedRows,
  onSelected,
  onFolioClick,
  onEditClick,
  onRelatedRowClick,
  leftHeaders,
  rightHeaders,
  allEntities,
  onRemove,
}: Props) {
  const { t } = useTranslation();

  const [headers, setHeaders] = useState<RowHeaderDisplayDto<RowWithDetails>[]>([]);
  const [actions, setActions] = useState<RowHeaderActionDto<RowWithDetails>[]>([]);

  const [toggledRows, setToggledRows] = useState<string[]>([]);

  useEffect(() => {
    let headers = RowDisplayHeaderHelper.getDisplayedHeaders({
      routes,
      entity,
      columns,
      layout: "table",
      allEntities,
      onFolioClick,
      onEditClick,
      onRelatedRowClick,
      t,
    });
    if (leftHeaders) {
      headers = [...leftHeaders, ...headers];
    }
    if (rightHeaders) {
      headers = [...headers, ...rightHeaders];
    }
    setHeaders(headers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, columns]);

  useEffect(() => {
    const actions: RowHeaderActionDto<RowWithDetails>[] = [];
    if (editable) {
      actions.push({
        title: t("shared.edit"),
        onClickRoute: (_, item) => (onEditClick !== undefined ? undefined : EntityHelper.getRoutes({ routes, entity, item })?.edit ?? ""),
        onClick: (_, item) => (onEditClick !== undefined ? onEditClick(item) : undefined),
        hidden: (item) => !editable || !EntityHelper.getRoutes({ routes, entity, item })?.edit,
      });
    }
    if (onRemove) {
      actions.push({
        title: (
          <div>
            <TrashIcon className="h-4 w-4 text-gray-300 hover:text-gray-600" />
          </div>
        ),
        onClick: (_, item) => onRemove(item),
        firstColumn: true,
      });
    }
    setActions(actions);
  }, [editable, entity, onEditClick, onRemove, routes, t]);

  return (
    <div className={clsx(className, "space-y-2")}>
      {items.map((item, idx) => {
        return (
          <div key={idx} className="space-y-2">
            <div className="rounded-md border border-gray-300 bg-white px-4 py-0.5 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2 truncate">
                    <div className=" flex items-center space-x-3 truncate">
                      {/* <div className="hidden flex-shrink-0 sm:flex">
                      <OrderListButtons index={idx} items={data.items} editable={true} />
                    </div> */}
                      <div className="flex items-center space-x-2 truncate text-sm text-gray-800">
                        <div className="flex items-baseline space-x-1 truncate">
                          <div className="flex flex-col">
                            <div className="flex items-baseline space-x-2">
                              <div>{RowHelper.getTextDescription({ entity, item })}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 space-x-1">
                    <div className="flex items-center space-x-1 truncate p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setToggledRows((prev) => {
                            if (prev.includes(item.id)) {
                              return prev.filter((f) => f !== item.id);
                            }
                            return [...prev, item.id];
                          });
                        }}
                        className="group flex items-center rounded-md border border-transparent p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                      >
                        <FolderIconFilled className="h-4 w-4 text-gray-300 hover:text-gray-500" />
                      </button>
                      <Link
                        to={item.id}
                        className="group flex items-center rounded-md border border-transparent p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                      >
                        <PencilIcon className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {toggledRows.includes(item.id) && <ToggledRow entity={entity} item={item} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToggledRow({ entity, item }: { entity: EntityWithDetails; item: RowWithDetails }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 pb-2">
      <div className="w-full space-y-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
        {entity.childEntities.map((childEntity) => {
          return (
            <Fragment key={childEntity.id}>
              <div className="text-sm font-medium text-gray-700">{t(childEntity.child.titlePlural)}</div>
              <div className="space-y-2">
                <ChildRows item={item} relationship={childEntity} />
                {/* <button
                  type="button"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-200 px-12 py-4 text-center hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
                >
                  <span className="block text-xs font-medium text-gray-600">New</span>
                </button> */}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ChildRows({ item, relationship }: { item: RowWithDetails; relationship: EntityRelationshipWithDetails }) {
  const appOrAdminData = useAppOrAdminData();
  const [entity, setEntity] = useState<EntityWithDetails>();
  useEffect(() => {
    setEntity(appOrAdminData.entities.find((f) => f.name === relationship.child.name));
  }, [relationship, appOrAdminData.entities]);
  return (
    <div className="space-y-2">
      {item.childRows
        .filter((f) => f.relationshipId === relationship.id)
        .map(({ child }, idx) => {
          return (
            <div key={child.id} className="flex items-center space-x-2 truncate text-sm text-gray-800">
              {entity && RowHelper.getTextDescription({ entity, item: child })}
            </div>
          );
        })}
    </div>
  );
}
