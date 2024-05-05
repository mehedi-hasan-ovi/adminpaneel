// Route View (Client component): Share row with other accounts, users, roles, and groups
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useTypedLoaderData } from "remix-typedjson";
import RowSettingsPermissions from "~/components/entities/rows/RowSettingsPermissions";
import { ContractRoutesShareApi } from "../api/ContractRoutes.Share.Api";

export default function ContractRoutesShareView() {
  const data = useTypedLoaderData<ContractRoutesShareApi.LoaderData>();
  return <RowSettingsPermissions item={data.item.row} items={data.item.row.permissions} tenants={data.tenants} users={data.users} />;
}
