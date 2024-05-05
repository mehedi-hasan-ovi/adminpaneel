import { ActionFunction, LoaderFunction } from "@remix-run/node";
import SendersEditRoute from "~/modules/emailMarketing/components/senders/SendersEditRoute";
import { Senders_Edit } from "~/modules/emailMarketing/routes/Senders_Edit";

export let loader: LoaderFunction = (args) => Senders_Edit.loader(args);
export const action: ActionFunction = (args) => Senders_Edit.action(args);

export default () => <SendersEditRoute />;
