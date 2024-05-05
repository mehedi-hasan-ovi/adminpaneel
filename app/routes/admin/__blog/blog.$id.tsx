import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { BlogRoutesEditApi } from "~/modules/blog/routes/api/BlogRoutes.Edit.Api";
import BlogEditView from "~/modules/blog/routes/views/BlogRoutes.Edit.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = (args: LoaderArgs) => BlogRoutesEditApi.loader(args);
export const action = (args: ActionArgs) => BlogRoutesEditApi.action(args);

export default () => <BlogEditView />;

export function ErrorBoundary() {
  return <ServerError />;
}
