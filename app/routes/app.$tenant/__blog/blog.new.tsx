import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { BlogRoutesNewApi } from "~/modules/blog/routes/api/BlogRoutes.New.Api";
import BlogNewView from "~/modules/blog/routes/views/BlogRoutes.New.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => BlogRoutesNewApi.loader(args);
export const action = (args: ActionArgs) => BlogRoutesNewApi.action(args);

export default () => <BlogNewView />;

export function ErrorBoundary() {
  return <ServerError />;
}
