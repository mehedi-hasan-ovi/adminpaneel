// Route View (Client component): Set row tags
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { useTypedLoaderData } from "remix-typedjson";
import RowSettingsTags from "~/components/entities/rows/RowSettingsTags";
import { AllPropertyTypesEntityRoutesTagsApi } from "../api/AllPropertyTypesEntityRoutes.Tags.Api";

export default function AllPropertyTypesEntityRoutesTagsView() {
  const data = useTypedLoaderData<AllPropertyTypesEntityRoutesTagsApi.LoaderData>();
  return <RowSettingsTags item={data.item.row} tags={data.tags} />;
}
