// Route: Orchestrates Tags API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesTagsApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.Tags.Api";
import ContractRoutesTagsView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.Tags.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesTagsApi.loader(args);
export const action: ActionFunction = (args) => ContractRoutesTagsApi.action(args);

export default () => <ContractRoutesTagsView />;

export function ErrorBoundary() {
  return <ServerError />;
}
