import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import KbRoutesIndex from "~/modules/knowledgeBase/routes/views/KbRoutes.Index.View";
import { KbRoutesIndexApi } from "~/modules/knowledgeBase/routes/api/KbRoutes.Index.Api";
import ServerError from "~/components/ui/errors/ServerError";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => KbRoutesIndexApi.loader(args, { kbSlug: "docs" });
// export const action = (args: ActionArgs) => KbRoutesIndexApi.action(args);

export default () => <KbRoutesIndex />;

export function ErrorBoundary() {
  return <ServerError />;
}
