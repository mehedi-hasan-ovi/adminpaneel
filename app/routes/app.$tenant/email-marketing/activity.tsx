import { LoaderFunction } from "@remix-run/node";
import OutboundEmailsListRoute from "~/modules/emailMarketing/components/outboundEmails/OutboundEmailsListRoute";
import { OutboundEmails_List } from "~/modules/emailMarketing/routes/OutboundEmails_List";

export let loader: LoaderFunction = (args) => OutboundEmails_List.loader(args);

export default () => <OutboundEmailsListRoute />;
