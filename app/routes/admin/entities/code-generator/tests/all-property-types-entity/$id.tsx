// Route: Orchestrates Edit API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesEditApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.Edit.Api";
import AllPropertyTypesEntityRoutesEditView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.Edit.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesEditApi.loader(args);
export const action: ActionFunction = (args) => AllPropertyTypesEntityRoutesEditApi.action(args);

export default () => <AllPropertyTypesEntityRoutesEditView />;

export function ErrorBoundary() {
  return <ServerError />;
}
