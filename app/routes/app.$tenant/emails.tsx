import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { loaderEmails } from "~/modules/emails/loaders/inbound-emails";
import InboundEmailsRoute from "~/modules/emails/routes/InboundEmailsRoute";
import { actionInboundEmails } from "~/modules/emails/actions/inbound-emails";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

export let loader: LoaderFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdFromUrl(params);
  return json(await loaderEmails(request, params, tenantId));
};

export const action: ActionFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdFromUrl(params);
  return await actionInboundEmails(request, params, tenantId);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default InboundEmailsRoute;
