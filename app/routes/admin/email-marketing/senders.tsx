import SendersListRoute from "~/modules/emailMarketing/components/senders/SendersListRoute";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Senders_List } from "~/modules/emailMarketing/routes/Senders_List";

export let loader: LoaderFunction = (args) => Senders_List.loader(args);
export const action: ActionFunction = (args) => Senders_List.action(args);

export default () => <SendersListRoute />;
