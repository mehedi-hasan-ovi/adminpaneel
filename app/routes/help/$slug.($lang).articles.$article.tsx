import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { KbRoutesArticleApi } from "~/modules/knowledgeBase/routes/api/KbRoutes.Article.Api";
import KbRoutesArticleView from "~/modules/knowledgeBase/routes/views/KbRoutes.Article.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => KbRoutesArticleApi.loader(args);
export const action = (args: ActionArgs) => KbRoutesArticleApi.action(args);

export default () => <KbRoutesArticleView />;

export function ErrorBoundary() {
  return <ServerError />;
}
