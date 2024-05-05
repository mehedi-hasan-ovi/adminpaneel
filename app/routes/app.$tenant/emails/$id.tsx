import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { actionInboundEmailEdit } from "~/modules/emails/actions/inbound-email-edit";
import { loaderEmailEdit } from "~/modules/emails/loaders/inbound-email-edit";
import InboundEmailRoute from "~/modules/emails/routes/InboundEmailEditRoute";
import UrlUtils from "~/utils/app/UrlUtils";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

export let loader: LoaderFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdFromUrl(params);
  return json(await loaderEmailEdit(request, params, tenantId, UrlUtils.currentTenantUrl(params, "emails")));
};

export const action: ActionFunction = async ({ request, params }) => {
  return await actionInboundEmailEdit(request, params, UrlUtils.currentTenantUrl(params, "emails"));
};

export default InboundEmailRoute;
