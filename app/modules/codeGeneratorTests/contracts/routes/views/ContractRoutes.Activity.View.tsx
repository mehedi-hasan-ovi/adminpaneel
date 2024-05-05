// Route View (Client component): History and comments for row
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useTypedLoaderData } from "remix-typedjson";
import RowActivity from "~/components/entities/rows/RowActivity";
import { ContractRoutesActivityApi } from "../api/ContractRoutes.Activity.Api";

export default function ContractRoutesActivityView() {
  const data = useTypedLoaderData<ContractRoutesActivityApi.LoaderData>();
  return <RowActivity items={data.logs} withTitle={false} hasActivity={true} hasComments={data.permissions.canComment} hasWorkflow={true} />;
}
