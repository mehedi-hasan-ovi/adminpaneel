import { useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import TableSimple from "~/components/ui/tables/TableSimple";
import { getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import DateUtils from "~/utils/shared/DateUtils";
import { useTypedLoaderData } from "remix-typedjson";
import { getAllTenantIpAddresses, TenantIpAddressWithDetails } from "~/utils/db/tenants/tenantIpAddress.db.server";
import TenantBadge from "~/components/core/tenants/TenantBadge";
import UserBadge from "~/components/core/users/UserBadge";
import ApiKeyBadge from "~/components/core/users/ApiKeyBadge";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";

type LoaderData = {
  title: string;
  items: TenantIpAddressWithDetails[];
  pagination: PaginationDto;
};

export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.tenantIpAddress.view");
  let { t } = await i18nHelper(request);

  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const { items, pagination } = await getAllTenantIpAddresses(currentPagination);

  const data: LoaderData = {
    title: `${t("models.tenantIpAddress.plural")} | ${process.env.APP_NAME}`,
    items,
    pagination,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function TenantIpAddresses() {
  const data = useTypedLoaderData<LoaderData>();
  const { t } = useTranslation();
  return (
    <EditPageLayout title={t("models.tenantIpAddress.plural")}>
      <TableSimple
        items={data.items}
        headers={[
          {
            name: "tenant",
            title: t("models.tenant.object"),
            value: (i) => <TenantBadge item={i.tenant} />,
          },
          {
            name: "ip",
            title: t("models.tenantIpAddress.object"),
            value: (i) => i.ip,
          },
          {
            name: "fromUrl",
            title: t("models.tenantIpAddress.fromUrl"),
            value: (i) => i.fromUrl,
          },
          {
            name: "user",
            title: t("models.user.object"),
            value: (i) => <div>{i.user ? <UserBadge item={i.user} /> : <span>?</span>}</div>,
          },
          {
            name: "apiKey",
            title: t("models.apiKey.object"),
            value: (i) => <div>{i.apiKey ? <ApiKeyBadge item={i.apiKey} /> : <span>?</span>}</div>,
          },
          {
            name: "createdAt",
            title: t("shared.createdAt"),
            value: (item) => DateUtils.dateAgo(item.createdAt),
            className: "text-gray-400 text-xs",
            breakpoint: "sm",
          },
        ]}
        pagination={data.pagination}
      />
    </EditPageLayout>
  );
}
