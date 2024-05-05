// Route: Orchestrates Edit API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesEditApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.Edit.Api";
import ContractRoutesEditView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.Edit.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesEditApi.loader(args);
export const action: ActionFunction = (args) => ContractRoutesEditApi.action(args);

export default () => <ContractRoutesEditView />;

export function ErrorBoundary() {
  return <ServerError />;
}
