import { json, LoaderFunction } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import ApiKeyLogsTable from "~/components/core/apiKeys/ApiKeyLogsTable";
import InputFilters from "~/components/ui/input/InputFilters";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import UrlUtils from "~/utils/app/UrlUtils";
import { ApiKeyLogWithDetails, getTenantApiKeyLogs } from "~/utils/db/apiKeys.db.server";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

type LoaderData = {
  items: ApiKeyLogWithDetails[];
  pagination: PaginationDto;
  filterableProperties: FilterablePropertyDto[];
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdFromUrl(params);
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
  const { items, pagination } = await getTenantApiKeyLogs(tenantId, currentPagination, filters);
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
  const params = useParams();
  return (
    <IndexPageLayout
      replaceTitleWithTabs={true}
      tabs={[
        {
          name: t("models.apiKey.plural"),
          routePath: UrlUtils.currentTenantUrl(params, "settings/api/keys"),
        },
        {
          name: t("models.apiKey.logs"),
          routePath: UrlUtils.currentTenantUrl(params, "settings/api/logs"),
        },
      ]}
      buttons={<InputFilters filters={data.filterableProperties} />}
    >
      <ApiKeyLogsTable withTenant={false} items={data.items} pagination={data.pagination} />
    </IndexPageLayout>
  );
}
