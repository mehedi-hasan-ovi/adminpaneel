import { ActionFunction, LoaderFunction } from "@remix-run/node";
import PageBlocksRouteIndex from "~/modules/pageBlocks/components/pages/PageBlocksRouteIndex";
import { PageBlocks_Index } from "~/modules/pageBlocks/routes/pages/PageBlocks_Index";

export let loader: LoaderFunction = (args) => PageBlocks_Index.loader(args);
export const action: ActionFunction = (args) => PageBlocks_Index.action(args);

export default () => <PageBlocksRouteIndex />;
