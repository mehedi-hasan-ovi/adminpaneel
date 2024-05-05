import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import RowsList from "~/components/entities/rows/RowsList";
import { i18nHelper } from "~/locale/i18n.utils";
import { EntityWithDetails, getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import ServerError from "~/components/ui/errors/ServerError";
import { getPaginationFromCurrentUrl, getRowsWithPagination } from "~/utils/helpers/RowPaginationHelper";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  entity: EntityWithDetails;
  items: RowWithDetails[];
  pagination: PaginationDto;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity ?? "" });
  if (!entity) {
    return redirect("/admin/entities");
  }
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const { items, pagination } = await getRowsWithPagination({
    entityId: entity.id,
    page: currentPagination.page,
    pageSize: currentPagination.pageSize,
  });
  const data: LoaderData = {
    entity,
    items,
    pagination,
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
  const data = useTypedLoaderData<LoaderData>();
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium leading-3 text-gray-800">Rows</h3>
      <RowsList view="table" entity={data.entity} items={data.items} pagination={data.pagination} />
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
