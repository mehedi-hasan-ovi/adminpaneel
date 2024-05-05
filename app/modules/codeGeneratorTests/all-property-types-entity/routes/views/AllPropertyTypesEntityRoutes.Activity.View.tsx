// Route View (Client component): History and comments for row
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { useTypedLoaderData } from "remix-typedjson";
import RowActivity from "~/components/entities/rows/RowActivity";
import { AllPropertyTypesEntityRoutesActivityApi } from "../api/AllPropertyTypesEntityRoutes.Activity.Api";

export default function AllPropertyTypesEntityRoutesActivityView() {
  const data = useTypedLoaderData<AllPropertyTypesEntityRoutesActivityApi.LoaderData>();
  return <RowActivity items={data.logs} withTitle={false} hasActivity={true} hasComments={data.permissions.canComment} hasWorkflow={true} />;
}
