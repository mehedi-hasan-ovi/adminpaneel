import { json, LoaderFunction } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import EventsTable from "~/components/core/events/EventsTable";
import InputFilters from "~/components/ui/input/InputFilters";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import { EventWithAttempts, getEvents } from "~/utils/db/events/events.db.server";
import { adminGetAllTenantsIdsAndNames } from "~/utils/db/tenants.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";

type LoaderData = {
  title: string;
  items: EventWithAttempts[];
  pagination: PaginationDto;
  filterableProperties: FilterablePropertyDto[];
};
export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.events.view");
  const { t } = await i18nHelper(request);

  const urlSearchParams = new URL(request.url).searchParams;
  const current = getPaginationFromCurrentUrl(urlSearchParams);
  const filterableProperties: FilterablePropertyDto[] = [
    {
      name: "name",
      title: "Event",
      options: Object.values(ApplicationEvent).map((item) => {
        return {
          value: item,
          name: item,
        };
      }),
    },
    {
      name: "data",
      title: "Data",
    },
    {
      name: "tenantId",
      title: "models.tenant.object",
      options: (await adminGetAllTenantsIdsAndNames()).map((tenant) => {
        return {
          value: tenant.id,
          name: tenant.name,
        };
      }),
    },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const { items, pagination } = await getEvents({ current, filters });

  const data: LoaderData = {
    title: `${t("models.event.eventsAndWebhooks")} | ${process.env.APP_NAME}`,
    items,
    pagination,
    filterableProperties,
  };
  return json(data);
};

export default function AdminEventsRoute() {
  const data = useTypedLoaderData<LoaderData>();

  return (
    <IndexPageLayout
      title="Events"
      buttons={
        <>
          <InputFilters filters={data.filterableProperties} />
        </>
      }
    >
      <EventsTable items={data.items} pagination={data.pagination} />
    </IndexPageLayout>
  );
}
