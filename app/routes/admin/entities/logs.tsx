import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import LogsTable from "~/components/app/events/LogsTable";
import InputFilters from "~/components/ui/input/InputFilters";
import { i18nHelper } from "~/locale/i18n.utils";
import { getAllEntities } from "~/utils/db/entities/entities.db.server";
import { getAllRowLogs, LogWithDetails } from "~/utils/db/logs.db.server";
import { adminGetAllTenants } from "~/utils/db/tenants.db.server";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { getTenantIdOrNull } from "~/utils/services/urlService";

type LoaderData = {
  items: LogWithDetails[];
  pagination: PaginationDto;
  filterableProperties: FilterablePropertyDto[];
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdOrNull({ request, params });
  const entities = await getAllEntities({ tenantId });
  const filterableProperties: FilterablePropertyDto[] = [
    {
      name: "entityId",
      title: "models.entity.object",
      options: entities.map((i) => {
        return { value: i.id, name: i.name };
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
    {
      name: "rowId",
      title: "models.row.object",
    },
  ];
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const filterTenantId = filters.properties.find((f) => f.name === "tenantId")?.value;
  const { items, pagination } = await getAllRowLogs({
    entityId: filters.properties.find((f) => f.name === "entityId")?.value ?? undefined,
    rowId: filters.properties.find((f) => f.name === "rowId")?.value ?? undefined,
    tenantId: filterTenantId === "null" ? null : filterTenantId ?? undefined,
    pagination: {
      page: currentPagination.page,
      pageSize: currentPagination.pageSize,
    },
  });
  const data: LoaderData = {
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

export default function EditEntityIndexRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-2 pb-6 sm:px-6 sm:pt-3 lg:px-8 xl:max-w-full">
      <div className="md:border-b md:border-gray-200 md:py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t("models.log.plural")}</h3>
          <div className="flex items-center space-x-2">
            <InputFilters withSearch={false} filters={data.filterableProperties} />
          </div>
        </div>
      </div>

      <LogsTable withTenant={true} items={data.items} pagination={data.pagination} />
    </div>
  );
}
