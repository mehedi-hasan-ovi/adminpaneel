// Route: Orchestrates Activity API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesActivityApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.Activity.Api";
import AllPropertyTypesEntityRoutesActivityView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.Activity.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesActivityApi.loader(args);
export const action: ActionFunction = (args) => AllPropertyTypesEntityRoutesActivityApi.action(args);

export default () => <AllPropertyTypesEntityRoutesActivityView />;

export function ErrorBoundary() {
  return <ServerError />;
}
