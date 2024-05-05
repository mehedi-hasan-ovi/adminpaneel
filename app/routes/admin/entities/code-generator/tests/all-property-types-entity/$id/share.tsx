// Route: Orchestrates Share API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesShareApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.Share.Api";
import AllPropertyTypesEntityRoutesShareView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.Share.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesShareApi.loader(args);
export const action: ActionFunction = (args) => AllPropertyTypesEntityRoutesShareApi.action(args);

export default () => <AllPropertyTypesEntityRoutesShareView />;

export function ErrorBoundary() {
  return <ServerError />;
}
