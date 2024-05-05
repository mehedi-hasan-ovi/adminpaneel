import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { EntityWithDetails, getAllEntities } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import TableSimple from "~/components/ui/tables/TableSimple";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl, getRowsWithPagination } from "~/utils/helpers/RowPaginationHelper";
import { useTranslation } from "react-i18next";
import RowHelper from "~/utils/helpers/RowHelper";
import DateUtils from "~/utils/shared/DateUtils";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import InputFilters from "~/components/ui/input/InputFilters";
import ActivityHistoryIcon from "~/components/ui/icons/entities/ActivityHistoryIcon";
import { adminGetAllTenants } from "~/utils/db/tenants.db.server";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  items: RowWithDetails[];
  pagination: PaginationDto;
  entities: EntityWithDetails[];
  filterableProperties: FilterablePropertyDto[];
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const entities = await getAllEntities({ tenantId: null });
  const filterableProperties: FilterablePropertyDto[] = [
    {
      name: "entity",
      title: "models.entity.object",
      options: entities.map((i) => {
        return {
          value: i.id,
          name: i.name,
        };
      }),
    },
    {
      name: "tenantId",
      title: "models.tenant.object",
      options: [
        { name: "{Admin}", value: "null" },
        ...(await adminGetAllTenants()).map((i) => {
          return { value: i.id, name: i.name };
        }),
      ],
    },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const filterTenantId = filters.properties.find((f) => f.name === "tenantId")?.value;
  const { items, pagination } = await getRowsWithPagination({
    page: currentPagination.page,
    pageSize: currentPagination.pageSize,
    rowWhere: {
      entityId: filters.properties.find((f) => f.name === "entity")?.value ?? undefined,
      tenantId: filterTenantId === "null" ? null : filterTenantId ?? undefined,
    },
  });
  const data: LoaderData = {
    entities,
    items,
    pagination,
    filterableProperties,
  };
  return json(data);
};

type ActionData = {
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  return badRequest({ error: t("shared.invalidForm") });
};

export default function AdminEntityRowsRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  function findEntity(item: RowWithDetails) {
    return data.entities.find((e) => e.id === item.entityId);
  }
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-2 pb-6 sm:px-6 sm:pt-3 lg:px-8 xl:max-w-full">
      <div className="md:border-b md:border-gray-200 md:py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t("models.row.plural")}</h3>
          <div className="flex items-center space-x-2">
            <InputFilters withSearch={false} filters={data.filterableProperties} />
          </div>
        </div>
      </div>

      <TableSimple
        headers={[
          {
            name: "tenant",
            title: t("models.tenant.object"),
            value: (item) => (
              <div>
                {item.tenant ? (
                  <Link
                    to={`/app/${item.tenant?.slug}`}
                    className="rounded-md border-b border-dashed border-transparent hover:border-gray-400 focus:bg-gray-100"
                  >
                    {item.tenant.name}
                  </Link>
                ) : (
                  <div>-</div>
                )}
              </div>
            ),
            breakpoint: "sm",
          },
          {
            name: "entity",
            title: t("models.entity.object"),
            value: (i) => t(findEntity(i)?.title ?? ""),
          },
          {
            name: "folio",
            title: t("models.row.folio"),
            value: (i) => RowHelper.getRowFolio(findEntity(i)!, i),
          },
          {
            name: "description",
            title: t("shared.description"),
            value: (i) => RowHelper.getTextDescription({ entity: findEntity(i)!, item: i, t }),
          },
          {
            name: "workflowState",
            title: t("models.workflowState.object"),
            value: (item) => <>{item.workflowState && <WorkflowStateBadge state={item.workflowState} />}</>,
          },
          {
            name: "logs",
            title: t("models.log.plural"),
            value: (item) => (
              <Link to={"/admin/entities/logs?rowId=" + item.id}>
                <ActivityHistoryIcon className="h-4 w-4 text-gray-500 hover:text-theme-800" />
              </Link>
            ),
          },
          {
            name: "createdByUser",
            title: t("shared.createdBy"),
            value: (item) => item.createdByUser?.email ?? (item.createdByApiKey ? "API" : "?"),
            className: "text-gray-400 text-xs",
            breakpoint: "sm",
          },
          {
            name: "createdAt",
            title: t("shared.createdAt"),
            value: (item) => DateUtils.dateAgo(item.createdAt),
            formattedValue: (item) => (
              <div className="flex flex-col">
                <div>{DateUtils.dateYMD(item.createdAt)}</div>
                <div className="text-xs">{DateUtils.dateAgo(item.createdAt)}</div>
              </div>
            ),
            className: "text-gray-400 text-xs",
            breakpoint: "sm",
            sortable: true,
          },
        ]}
        items={data.items}
        pagination={data.pagination}
      />
    </div>
  );
}
