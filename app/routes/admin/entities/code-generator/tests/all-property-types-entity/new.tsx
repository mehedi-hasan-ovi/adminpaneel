// Route: Orchestrates New API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesNewApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.New.Api";
import AllPropertyTypesEntityRoutesNewView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.New.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesNewApi.loader(args);
export const action: ActionFunction = (args) => AllPropertyTypesEntityRoutesNewApi.action(args);

export default () => <AllPropertyTypesEntityRoutesNewView />;

export function ErrorBoundary() {
  return <ServerError />;
}
