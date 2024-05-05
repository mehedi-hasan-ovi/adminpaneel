import { json, LoaderFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { setApiKeyLogStatus } from "~/utils/db/apiKeys.db.server";
import { validateTenantApiKey } from "~/utils/services/apiService";

// GET
export const loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `api.usage`);
  const { t } = await time(i18nHelper(request), "i18nHelper");
  const { tenantApiKey } = await time(validateTenantApiKey(request, params), "validateTenantApiKey");
  try {
    if (!tenantApiKey) {
      throw Error("Invalid API key");
    }
    await time(
      setApiKeyLogStatus(tenantApiKey?.apiKeyLog.id, {
        status: 200,
      }),
      "setApiKeyLogStatus"
    );
    return json(
      {
        plan: t(tenantApiKey.usage?.title ?? "", [tenantApiKey.usage?.value]),
        remaining: tenantApiKey.usage?.remaining,
      },
      { headers: getServerTimingHeader() }
    );
  } catch (e: any) {
    if (tenantApiKey) {
      await time(
        setApiKeyLogStatus(tenantApiKey.apiKeyLog.id, {
          error: JSON.stringify(e),
          status: 400,
        }),
        "setApiKeyLogStatus"
      );
    }
    return json({ error: JSON.stringify(e) }, { status: 400, headers: getServerTimingHeader() });
  }
};
