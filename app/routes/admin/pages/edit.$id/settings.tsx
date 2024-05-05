import { ActionFunction, LoaderFunction } from "@remix-run/node";
import PageSettingsRouteIndex from "~/modules/pageBlocks/components/pages/PageSettingsRouteIndex";
import { PageSettings_Index } from "~/modules/pageBlocks/routes/pages/PageSettings_Index";

export let loader: LoaderFunction = (args) => PageSettings_Index.loader(args);
export const action: ActionFunction = (args) => PageSettings_Index.action(args);

export default () => <PageSettingsRouteIndex />;
