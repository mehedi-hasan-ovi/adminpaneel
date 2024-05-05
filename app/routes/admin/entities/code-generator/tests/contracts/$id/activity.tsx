// Route: Orchestrates Activity API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesActivityApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.Activity.Api";
import ContractRoutesActivityView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.Activity.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesActivityApi.loader(args);
export const action: ActionFunction = (args) => ContractRoutesActivityApi.action(args);

export default () => <ContractRoutesActivityView />;

export function ErrorBoundary() {
  return <ServerError />;
}
