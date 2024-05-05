import { json, LoaderFunction } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import ApiKeyLogsTable from "~/components/core/apiKeys/ApiKeyLogsTable";
import InputFilters from "~/components/ui/input/InputFilters";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import { ApiKeyLogWithDetails, getAllApiKeyLogs } from "~/utils/db/apiKeys.db.server";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";

type LoaderData = {
  items: ApiKeyLogWithDetails[];
  pagination: PaginationDto;
  filterableProperties: FilterablePropertyDto[];
};
export let loader: LoaderFunction = async ({ request }) => {
  const filterableProperties: FilterablePropertyDto[] = [
    { name: "ip", title: "models.apiKeyLog.ip" },
    { name: "endpoint", title: "models.apiKeyLog.endpoint" },
    { name: "method", title: "models.apiKeyLog.method" },
    { name: "status", title: "models.apiKeyLog.status", condition: "equals", isNumber: true },
    { name: "error", title: "models.apiKeyLog.error" },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const { items, pagination } = await getAllApiKeyLogs(currentPagination, filters);
  const data: LoaderData = {
    items,
    pagination,
    filterableProperties,
  };
  return json(data);
};

export default function AdminApiLogsRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  return (
    <>
      <EditPageLayout title={t("models.apiKeyLog.plural")} buttons={<InputFilters filters={data.filterableProperties} />}>
        <ApiKeyLogsTable withTenant={true} items={data.items} pagination={data.pagination} />
      </EditPageLayout>
    </>
  );
}
