import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";
import { DefaultLogActions } from "~/application/dtos/shared/DefaultLogActions";
import { i18nHelper } from "~/locale/i18n.utils";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { RowsApi } from "~/utils/api/RowsApi";
import { setApiKeyLogStatus } from "~/utils/db/apiKeys.db.server";
import { getAllEntities, getEntityByIdNameOrSlug } from "~/utils/db/entities/entities.db.server";
import { createRowLog } from "~/utils/db/logs.db.server";
import ApiHelper from "~/utils/helpers/ApiHelper";
import { ApiAccessValidation, validateApiKey } from "~/utils/services/apiService";
import { reportUsage } from "~/utils/services/subscriptionService";

// GET
export const loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Rows_API_GET_ALL] ${params.entity}`);
  const { t } = await time(i18nHelper(request), "i18nHelper");
  invariant(params.entity, "Expected params.entity");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, tenantApiKey, userId } = apiAccessValidation;
    const urlSearchParams = new URL(request.url).searchParams;
    const entity = await time(getEntityByIdNameOrSlug({ tenantId: tenant?.id ?? null, idNameOrSlug: params.entity! }), "getEntityByIdNameOrSlug");
    const data = await time(
      RowsApi.getAll({
        entity,
        tenantId: tenant?.id ?? null,
        userId,
        urlSearchParams,
        time,
      }),
      "RowsApi.getAll"
    );
    if (tenant && tenantApiKey) {
      await time(
        setApiKeyLogStatus(tenantApiKey.apiKeyLog.id, {
          status: 200,
        }),
        "setApiKeyLogStatus"
      );
      await time(reportUsage(tenant.id, "api"), "reportUsage");
    }

    let usage = undefined;
    if (tenantApiKey) {
      usage = {
        plan: t(tenantApiKey.usage?.title ?? "", [tenantApiKey.usage?.value]),
        remaining: tenantApiKey.usage?.remaining,
      };
    }
    const entities = await time(getAllEntities({ tenantId: tenant?.id ?? null }), "getAllEntities");
    return json(
      {
        success: true,
        page: data.pagination?.page,
        total_pages: data.pagination?.totalPages,
        total_results: data.pagination?.totalItems,
        results: data.pagination?.totalItems,
        data: data.items.map((item) => {
          return ApiHelper.getApiFormatWithRelationships({
            entities,
            item,
          });
        }),
        usage,
      },
      { headers: getServerTimingHeader() }
    );
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error({ error: e.message });
    if (apiAccessValidation?.tenantApiKey) {
      await time(
        setApiKeyLogStatus(apiAccessValidation?.tenantApiKey.apiKeyLog.id, {
          error: JSON.stringify(e),
          status: 400,
        }),
        "setApiKeyLogStatus"
      );
    }
    return json({ error: e.message }, { status: 400, headers: getServerTimingHeader() });
  }
};

// POST
export const action: ActionFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Rows_API_POST] ${params.entity}`);
  invariant(params.entity, "Expected params.entity");
  const { t } = await time(i18nHelper(request), "i18nHelper");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, tenantApiKey, userId } = apiAccessValidation;
    const entity = await time(getEntityByIdNameOrSlug({ tenantId: tenant?.id ?? null, idNameOrSlug: params.entity! }), "getEntityByIdNameOrSlug");
    if (request.method !== "POST") {
      throw new Error("Method not allowed");
    }
    const jsonBody = await time(request.json(), "request.json");
    const rowValues = ApiHelper.getRowPropertiesFromJson(t, entity, jsonBody);
    const item = await time(
      RowsApi.create({
        entity,
        tenantId: tenant?.id ?? null,
        userId,
        rowValues,
        time,
      }),
      "RowsApi.create"
    );
    if (tenant && tenantApiKey) {
      await time(
        setApiKeyLogStatus(tenantApiKey.apiKeyLog.id, {
          status: 201,
        }),
        "setApiKeyLogStatus"
      );
      await time(reportUsage(tenant.id, "api"), "reportUsage");
    }
    await time(
      createRowLog(request, {
        tenantId: tenant?.id ?? null,
        createdByApiKey: tenantApiKey?.apiKeyLog.apiKeyId,
        action: DefaultLogActions.Created,
        entity,
        item,
      }),
      "createRowLog"
    );
    return json(ApiHelper.getApiFormat(entity, item), {
      status: 201,
      headers: getServerTimingHeader(),
    });
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
