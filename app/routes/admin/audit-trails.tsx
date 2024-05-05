import { useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import LogsTable from "~/components/app/events/LogsTable";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import { getAllLogs, LogWithDetails } from "~/utils/db/logs.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import InputFilters from "~/components/ui/input/InputFilters";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  title: string;
  items: LogWithDetails[];
  pagination: PaginationDto;
  filterableProperties: FilterablePropertyDto[];
};

export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.auditTrails.view");
  const { t } = await i18nHelper(request);

  const filterableProperties: FilterablePropertyDto[] = [
    {
      name: "action",
      title: "models.log.action",
    },
    {
      name: "url",
      title: "models.log.url",
    },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const { items, pagination } = await getAllLogs(currentPagination, filters);

  const data: LoaderData = {
    title: `${t("models.log.plural")} | ${process.env.APP_NAME}`,
    items,
    pagination,
    filterableProperties,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function Events() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();

  return (
    <IndexPageLayout title={t("models.log.plural")} buttons={<InputFilters filters={data.filterableProperties} />}>
      <LogsTable withTenant={true} items={data.items} pagination={data.pagination} />
    </IndexPageLayout>
  );
}
