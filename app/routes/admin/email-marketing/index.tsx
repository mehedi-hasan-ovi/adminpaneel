import { LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import EmailMarketingSummaryRoute from "~/modules/emailMarketing/components/EmailMarketingSummaryRoute";
import { EmailMarketing_Summary } from "~/modules/emailMarketing/routes/EmailMarketing_Summary";

export let loader: LoaderFunction = (args) => EmailMarketing_Summary.loader(args);

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default () => <EmailMarketingSummaryRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
