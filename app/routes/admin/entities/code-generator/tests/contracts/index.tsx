// Route: Orchestrates Index API and View
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { V2_MetaFunction, LoaderFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ContractRoutesIndexApi } from "~/modules/codeGeneratorTests/contracts/routes/api/ContractRoutes.Index.Api";
import ContractRoutesIndexView from "~/modules/codeGeneratorTests/contracts/routes/views/ContractRoutes.Index.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ContractRoutesIndexApi.loader(args);

export default () => <ContractRoutesIndexView />;

export function ErrorBoundary() {
  return <ServerError />;
}
