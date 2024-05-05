// Route View (Client component): Set row tags
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useTypedLoaderData } from "remix-typedjson";
import RowSettingsTags from "~/components/entities/rows/RowSettingsTags";
import { ContractRoutesTagsApi } from "../api/ContractRoutes.Tags.Api";

export default function ContractRoutesTagsView() {
  const data = useTypedLoaderData<ContractRoutesTagsApi.LoaderData>();
  return <RowSettingsTags item={data.item.row} tags={data.tags} />;
}
