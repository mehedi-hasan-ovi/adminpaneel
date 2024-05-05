import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import { getLinkedAccounts, LinkedAccountWithDetails } from "~/utils/db/linkedAccounts.db.server";
import { LinkedAccountStatus } from "~/application/enums/tenants/LinkedAccountStatus";
import { useState } from "react";
import { i18nHelper } from "~/locale/i18n.utils";
import LinkedAccountsTable from "~/components/app/linkedAccounts/LinkedAccountsTable";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import UrlUtils from "~/utils/app/UrlUtils";
import InputSearch from "~/components/ui/input/InputSearch";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  title: string;
  items: LinkedAccountWithDetails[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);

  const items = await getLinkedAccounts(tenantId, LinkedAccountStatus.LINKED);
  const data: LoaderData = {
    title: `${t("models.linkedAccount.plural")} | ${process.env.APP_NAME}`,
    items,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AllLinksRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");

  const filteredItems = () => {
    if (!data.items) {
      return [];
    }
    return data.items.filter(
      (f) =>
        f.clientTenant.name?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.providerTenant.name?.toString().toUpperCase().includes(searchInput.toUpperCase())
    );
  };
  return (
    <div>
      <div>
        <div className="space-y-2">
          <InputSearch
            value={searchInput}
            setValue={setSearchInput}
            onNew={() => navigate(UrlUtils.currentTenantUrl(params, "settings/linked-accounts/new"))}
          />
          <LinkedAccountsTable items={filteredItems()} canDelete={true} />
        </div>
      </div>
    </div>
  );
}
