// Route: Orchestrates New API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesNewApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.New.Api";
import ContractRoutesNewView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.New.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesNewApi.loader(args);
export const action: ActionFunction = (args) => ContractRoutesNewApi.action(args);

export default () => <ContractRoutesNewView />;

export function ErrorBoundary() {
  return <ServerError />;
}
