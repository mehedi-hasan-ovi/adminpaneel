import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { RowRelationshipsApi } from "~/utils/api/RowRelationshipsApi";
import { setApiKeyLogStatus } from "~/utils/db/apiKeys.db.server";
import ApiHelper from "~/utils/helpers/ApiHelper";
import { ApiAccessValidation, validateApiKey } from "~/utils/services/apiService";

// GET
export const loader = async ({ request, params }: LoaderArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Relationships_API_POST] ${params.entity}`);
  invariant(params.id, "Expected params.id");
  // const { t } = await time(i18nHelper(request), "i18nHelper");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, userId } = apiAccessValidation;
    const relationship = await RowRelationshipsApi.getRelationship(params.id!, {
      tenantId: tenant?.id ?? null,
      userId,
      time,
    });
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    return json(
      {
        relationship: {
          id: relationship.id,
          parent: ApiHelper.getApiFormat(relationship.parent.entity, relationship.parent.item),
          child: ApiHelper.getApiFormat(relationship.child.entity, relationship.child.item),
        },
      },
      { status: 200, headers: getServerTimingHeader() }
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

// POST
export const action = async ({ request, params }: ActionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Relationships_API_POST] ${params.entity}`);
  invariant(params.id, "Expected params.id");
  // const { t } = await time(i18nHelper(request), "i18nHelper");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, userId } = apiAccessValidation;
    if (request.method !== "DELETE") {
      throw new Error("Method not allowed");
    }
    const relationship = await RowRelationshipsApi.getRelationship(params.id!, {
      tenantId: tenant?.id ?? null,
      userId,
      time,
    });
    if (!relationship) {
      throw new Error("Relationship not found");
    }
    const item = await time(
      RowRelationshipsApi.deleteRelationshipById(params.id!, {
        tenantId: tenant?.id ?? null,
        userId,
        time,
      }),
      "RowRelationshipsApi.deleteRelationshipById"
    );
    return json({ deleted: item }, { status: 200, headers: getServerTimingHeader() });
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
