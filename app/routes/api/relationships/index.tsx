import { ActionFunction, json } from "@remix-run/node";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { RowRelationshipsApi } from "~/utils/api/RowRelationshipsApi";
import { setApiKeyLogStatus } from "~/utils/db/apiKeys.db.server";
import { getRowById } from "~/utils/db/entities/rows.db.server";
import { ApiAccessValidation, validateApiKey } from "~/utils/services/apiService";

// POST
export const action: ActionFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Relationships_API_POST]`);
  // const { t } = await time(i18nHelper(request), "i18nHelper");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    if (request.method !== "POST") {
      throw new Error("Method not allowed");
    }
    const jsonBody = await time(request.json(), "request.json");
    const { parent, child } = jsonBody;
    if (!parent) {
      throw new Error("Parent and child are required");
    }
    const parentRow = await getRowById(parent);
    const childRow = await getRowById(child);
    if (!parentRow) {
      throw new Error("Parent row not found: " + parent);
    } else if (!childRow) {
      throw new Error("Child row not found: " + child);
    }
    const item = await time(
      RowRelationshipsApi.createRelationship({
        parent: parentRow,
        child: childRow,
        time,
      }),
      "RowsApi.createRelationship"
    );
    return json(
      { relationship: item },
      {
        status: 201,
        headers: getServerTimingHeader(),
      }
    );
  } catch (e: any) {
    if (apiAccessValidation?.tenantApiKey) {
      await time(
        setApiKeyLogStatus(apiAccessValidation?.tenantApiKey.apiKeyLog.id, {
          error: e.message,
          status: 400,
        }),
        "setApiKeyLogStatus"
      );
    }
    return json({ error: e.message }, { status: 400, headers: getServerTimingHeader() });
  }
};
