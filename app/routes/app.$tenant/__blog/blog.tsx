import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { BlogRoutesIndexApi } from "~/modules/blog/routes/api/BlogRoutes.Index.Api";
import BlogView from "~/modules/blog/routes/views/BlogRoutes.Index.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => BlogRoutesIndexApi.loader(args);
// export const action = (args: ActionArgs) => BlogRoutesIndexApi.action(args);

export default () => <BlogView />;

export function ErrorBoundary() {
  return <ServerError />;
}
