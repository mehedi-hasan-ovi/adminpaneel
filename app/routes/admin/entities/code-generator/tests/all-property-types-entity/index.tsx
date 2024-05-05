// Route: Orchestrates Index API and View
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { V2_MetaFunction, LoaderFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { AllPropertyTypesEntityRoutesIndexApi } from "~/modules/codeGeneratorTests/all-property-types-entity/routes/api/AllPropertyTypesEntityRoutes.Index.Api";
import AllPropertyTypesEntityRoutesIndexView from "~/modules/codeGeneratorTests/all-property-types-entity/routes/views/AllPropertyTypesEntityRoutes.Index.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => AllPropertyTypesEntityRoutesIndexApi.loader(args);

export default () => <AllPropertyTypesEntityRoutesIndexView />;

export function ErrorBoundary() {
  return <ServerError />;
}
