// Route API (Loader and Action): Create new row
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { LoaderFunction, json, ActionFunction, redirect } from "@remix-run/node";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "~/utils/app/UrlUtils";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import ContractHelpers from "../../helpers/ContractHelpers";
import { ContractService } from "../../services/ContractService";

export namespace ContractRoutesNewApi {
  export type LoaderData = {
    metadata: [{ title: string }];
    featureUsage: PlanFeatureUsageDto | undefined;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const data: LoaderData = {
      metadata: [{ title: t("shared.create") + " Contract | " + process.env.APP_NAME }],
      featureUsage: tenantId ? await getPlanFeatureUsage(tenantId, "contract") : undefined,
    };
    return json(data);
  };

  export type ActionData = {
    success?: string;
    error?: string;
  };
  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const { userId } = await getUserInfo(request);
    const form = await request.formData();
    const action = form.get("action")?.toString();
    if (action === "create") {
      try {
        const { name, type, description, document, attachments, estimatedAmount, active, estimatedCompletionDate } = ContractHelpers.formToDto(form);
        if (name === undefined) throw new Error(t("Name") + " is required");
        if (type === undefined) throw new Error(t("Type") + " is required");
        if (document === undefined) throw new Error(t("Document") + " is required");
        if (estimatedAmount === undefined) throw new Error(t("Estimated Amount") + " is required");
        if (active === undefined) throw new Error(t("Active") + " is required");
        if (estimatedCompletionDate === undefined) throw new Error(t("Estimated Completion Date") + " is required");
        const item = await ContractService.create(
          { name, type, description, document, attachments, estimatedAmount, active, estimatedCompletionDate },
          { userId, tenantId }
        );
        return redirect(UrlUtils.getParentRoute(new URL(request.url).pathname) + "/" + item.row.id);
      } catch (error: any) {
        return json({ error: error.message }, { status: 400 });
      }
    } else {
      return json({ error: t("shared.invalidForm") }, { status: 400 });
    }
  };
}
