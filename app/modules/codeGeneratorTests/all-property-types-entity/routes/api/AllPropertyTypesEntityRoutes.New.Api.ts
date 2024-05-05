// Route API (Loader and Action): Create new row
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { LoaderFunction, json, ActionFunction, redirect } from "@remix-run/node";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "~/utils/app/UrlUtils";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import AllPropertyTypesEntityHelpers from "../../helpers/AllPropertyTypesEntityHelpers";
import { AllPropertyTypesEntityService } from "../../services/AllPropertyTypesEntityService";

export namespace AllPropertyTypesEntityRoutesNewApi {
  export type LoaderData = {
    metadata: [{ title: string }];
    featureUsage: PlanFeatureUsageDto | undefined;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const data: LoaderData = {
      metadata: [{ title: t("shared.create") + " AllPropertyTypesEntity | " + process.env.APP_NAME }],
      featureUsage: tenantId ? await getPlanFeatureUsage(tenantId, "allPropertyTypesEntity") : undefined,
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
        const { textSingleLine, textEmail, textPhone, textUrl, number, date, singleSelectDropdown, singleSelectRadioGroupCards, boolean, media, multiSelectCombobox, multiSelectCheckboxCards, numberRange, dateRange, multiText } = AllPropertyTypesEntityHelpers.formToDto(form);
        if (textSingleLine === undefined) throw new Error(t("Text (Single-line)") + " is required");
        if (textEmail === undefined) throw new Error(t("Text (Email)") + " is required");
        if (textPhone === undefined) throw new Error(t("Text (Phone)") + " is required");
        if (textUrl === undefined) throw new Error(t("Text (URL)") + " is required");
        if (number === undefined) throw new Error(t("Number") + " is required");
        if (date === undefined) throw new Error(t("Date") + " is required");
        if (singleSelectDropdown === undefined) throw new Error(t("Single Select (Dropdown)") + " is required");
        if (singleSelectRadioGroupCards === undefined) throw new Error(t("Single Select (Radio Group Cards)") + " is required");
        if (boolean === undefined) throw new Error(t("Boolean") + " is required");
        if (media === undefined) throw new Error(t("Media") + " is required");
        if (multiSelectCombobox === undefined) throw new Error(t("Multi Select (Combobox)") + " is required");
        if (multiSelectCheckboxCards === undefined) throw new Error(t("Multi Select (Checkbox Cards)") + " is required");
        if (numberRange === undefined) throw new Error(t("Number Range") + " is required");
        if (dateRange === undefined) throw new Error(t("Date Range") + " is required");
        if (multiText === undefined) throw new Error(t("Multi Text") + " is required");
        const item = await AllPropertyTypesEntityService.create(
          { textSingleLine, textEmail, textPhone, textUrl, number, date, singleSelectDropdown, singleSelectRadioGroupCards, boolean, media, multiSelectCombobox, multiSelectCheckboxCards, numberRange, dateRange, multiText },
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