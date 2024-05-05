import { json, LoaderFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import EmailMarketingService, { EmailMarketingSummaryDto } from "../services/EmailMarketingService";

export namespace EmailMarketing_Summary {
  export type LoaderData = {
    title: string;
    summary: EmailMarketingSummaryDto;
  };

  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const data: LoaderData = {
      title: `${t("emailMarketing.title")} | ${process.env.APP_NAME}`,
      summary: await EmailMarketingService.getSummary(tenantId),
    };
    return json(data);
  };
}
