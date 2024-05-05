// Route: Orchestrates Tags API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesTagsApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.Tags.Api";
import AllPropertyTypesEntityRoutesTagsView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.Tags.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesTagsApi.loader(args);
export const action: ActionFunction = (args) => AllPropertyTypesEntityRoutesTagsApi.action(args);

export default () => <AllPropertyTypesEntityRoutesTagsView />;

export function ErrorBoundary() {
  return <ServerError />;
}
