import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { actionInboundEmailEdit } from "~/modules/emails/actions/inbound-email-edit";
import { loaderEmailEdit } from "~/modules/emails/loaders/inbound-email-edit";
import InboundEmailRoute from "~/modules/emails/routes/InboundEmailEditRoute";

export let loader: LoaderFunction = async ({ request, params }) => {
  return json(await loaderEmailEdit(request, params, null, "/admin/help-desk/inbound-emails"));
};

export const action: ActionFunction = async ({ request, params }) => {
  return await actionInboundEmailEdit(request, params, "/admin/help-desk/inbound-emails");
};

export default InboundEmailRoute;
