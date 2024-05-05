import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { KbRoutesCategoryApi } from "~/modules/knowledgeBase/routes/api/KbRoutes.Category.Api";
import KbRoutesCategoryView from "~/modules/knowledgeBase/routes/views/KbRoutes.Category.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => KbRoutesCategoryApi.loader(args);
// export const action = (args: ActionArgs) => KbRoutesCategoryApi.action(args, { kbSlug: kbSlug: "docs",});

export default () => <KbRoutesCategoryView />;

export function ErrorBoundary() {
  return <ServerError />;
}
