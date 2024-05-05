import { ActionFunction, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import RowNewRoute from "~/modules/rows/components/RowNewRoute";
import { Rows_New } from "~/modules/rows/routes/Rows_New.server";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export const meta: V2_MetaFunction = ({ data }) => data?.meta;
export let loader: LoaderFunction = (args) => Rows_New.loader(args);
export const action: ActionFunction = (args) => Rows_New.action(args);

export default () => <RowNewRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
