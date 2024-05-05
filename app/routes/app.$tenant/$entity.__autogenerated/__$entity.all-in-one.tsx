import { ActionFunction, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { Rows_List } from "~/modules/rows/routes/Rows_List.server";
import RowsAllInOneRoute from "~/modules/rows/components/RowsAllInOneRoute";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export const meta: V2_MetaFunction = ({ data }) => data?.meta;
export let loader: LoaderFunction = (args) => Rows_List.loader(args);
export const action: ActionFunction = (args) => Rows_List.action(args);

export default () => <RowsAllInOneRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
