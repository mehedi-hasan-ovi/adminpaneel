// Route: Orchestrates Share API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesShareApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.Share.Api";
import ContractRoutesShareView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.Share.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesShareApi.loader(args);
export const action: ActionFunction = (args) => ContractRoutesShareApi.action(args);

export default () => <ContractRoutesShareView />;

export function ErrorBoundary() {
  return <ServerError />;
}
