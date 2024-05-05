import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import TableSimple from "~/components/ui/tables/TableSimple";
import { useTranslation } from "react-i18next";
import { TenantUserWithDetails } from "~/utils/db/tenants.db.server";
import { LinkedAccountsApi } from "~/utils/api/LinkedAccountsApi";
import UserBadge from "~/components/core/users/UserBadge";
import TenantBadge from "~/components/core/tenants/TenantBadge";
import { useState } from "react";
import InputSearch from "~/components/ui/input/InputSearch";

type LoaderData = {
  title: string;
  items: TenantUserWithDetails[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  await verifyUserHasPermission(request, "app.settings.linkedAccounts.view", tenantId);

  const items = await LinkedAccountsApi.getAllUsers(tenantId);
  const data: LoaderData = {
    title: `${t("models.user.plural")} | ${t("models.linkedAccount.plural")} | ${process.env.APP_NAME}`,
    items,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function LinkedAccountsRoute() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();

  const [searchInput, setSearchInput] = useState("");

  const filteredItems = () => {
    if (!data.items) {
      return [];
    }
    return data.items.filter(
      (i) =>
        i.user.email.toLowerCase().includes(searchInput.toLowerCase()) ||
        i.user.firstName.toLowerCase().includes(searchInput.toLowerCase()) ||
        i.user.lastName.toLowerCase().includes(searchInput.toLowerCase()) ||
        i.tenant.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-2 px-4 py-4 sm:px-6 lg:px-8 xl:max-w-7xl">
      <div className="space-y-2">
        <InputSearch value={searchInput} setValue={setSearchInput} />
        <TableSimple
          items={filteredItems()}
          headers={[
            {
              name: "tenant",
              title: t("models.tenant.object"),
              value: (i) => <TenantBadge item={i.tenant} showCurrent={true} />,
            },
            {
              name: "user",
              title: t("models.user.object"),
              value: (i) => <UserBadge item={i.user} showCurrent={true} />,
              className: "w-full",
            },
          ]}
        />
      </div>
    </div>
  );
}
