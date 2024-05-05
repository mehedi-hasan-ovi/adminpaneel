import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { loaderEmails } from "~/modules/emails/loaders/inbound-emails";
import InboundEmailsRoute from "~/modules/emails/routes/InboundEmailsRoute";
import { actionInboundEmails } from "~/modules/emails/actions/inbound-emails";

export let loader: LoaderFunction = async ({ request, params }) => {
  return json(await loaderEmails(request, params, null));
};

export const action: ActionFunction = async ({ request, params }) => {
  return await actionInboundEmails(request, params, null);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default InboundEmailsRoute;
