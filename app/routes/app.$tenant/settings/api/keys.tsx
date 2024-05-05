import { json, LoaderFunction } from "@remix-run/node";
import { Outlet, useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import ApiKeysTable from "~/components/core/apiKeys/ApiKeysTable";
import CheckPlanFeatureLimit from "~/components/core/settings/subscription/CheckPlanFeatureLimit";
import InfoBanner from "~/components/ui/banners/InfoBanner";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import UrlUtils from "~/utils/app/UrlUtils";
import { useAppData } from "~/utils/data/useAppData";
import { ApiKeyLogSimple, ApiKeyWithDetails, getAllApiKeyLogsSimple, getApiKeys } from "~/utils/db/apiKeys.db.server";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

type LoaderData = {
  apiKeys: ApiKeyWithDetails[];
  apiKeyLogs: ApiKeyLogSimple[];
  featurePlanUsage: PlanFeatureUsageDto | undefined;
};
export let loader: LoaderFunction = async ({ params }) => {
  const tenantId = await getTenantIdFromUrl(params);
  const apiKeys = await getApiKeys(tenantId);
  const apiKeyLogs = await getAllApiKeyLogsSimple(tenantId);
  const featurePlanUsage = await getPlanFeatureUsage(tenantId, DefaultFeatures.API);
  const data: LoaderData = {
    apiKeys,
    apiKeyLogs,
    featurePlanUsage,
  };
  return json(data);
};

export default function AdminApiKeysRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const appData = useAppData();
  const params = useParams();
  return (
    <>
      <IndexPageLayout
        replaceTitleWithTabs={true}
        tabs={[
          {
            name: t("models.apiKey.plural"),
            routePath: UrlUtils.currentTenantUrl(params, "settings/api/keys"),
          },
          {
            name: t("models.apiKey.logs"),
            routePath: UrlUtils.currentTenantUrl(params, "settings/api/logs"),
          },
        ]}
      >
        <CheckPlanFeatureLimit item={data.featurePlanUsage} hideContent={false}>
          <div className="space-y-2">
            <ApiKeysTable
              entities={appData.entities}
              items={data.apiKeys}
              logs={data.apiKeyLogs}
              withTenant={false}
              canCreate={getUserHasPermission(appData, "app.settings.apiKeys.create")}
            />
            {data.featurePlanUsage?.enabled && (
              <InfoBanner title="API usage" text="API calls remaining: ">
                {data.featurePlanUsage?.remaining === "unlimited" ? (
                  <span>{t("shared.unlimited")}</span>
                ) : (
                  <span>
                    <b>
                      {t("shared.remaining")} {data.featurePlanUsage.remaining}
                    </b>
                  </span>
                )}
              </InfoBanner>
            )}
          </div>
          <Outlet />
        </CheckPlanFeatureLimit>
      </IndexPageLayout>
    </>
  );
}
