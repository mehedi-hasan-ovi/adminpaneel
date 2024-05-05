import { LoaderFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { Rows_Relationships } from "~/modules/rows/routes/Rows_Relationships.server";
import RowsRelationshipsRoute from "~/modules/rows/components/RowsRelationshipsRoute";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export let loader: LoaderFunction = (args) => Rows_Relationships.loader(args);

export default () => <RowsRelationshipsRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
