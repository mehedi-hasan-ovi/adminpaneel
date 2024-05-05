import { ActionFunction, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import RowShareRoute from "~/modules/rows/components/RowShareRoute";
import { Rows_Share } from "~/modules/rows/routes/Rows_Share.server";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export const meta: V2_MetaFunction = ({ data }) => data?.meta;
export let loader: LoaderFunction = (args) => Rows_Share.loader(args);
export const action: ActionFunction = (args) => Rows_Share.action(args);

export default () => <RowShareRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
