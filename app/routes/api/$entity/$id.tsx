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
import { createRowDeletedEvent, createRowUpdatedEvent } from "~/utils/services/events/rowsEventsService";
import { ApiAccessValidation, validateApiKey } from "~/utils/services/apiService";
import { reportUsage } from "~/utils/services/subscriptionService";

// GET
export const loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Rows_API_GET] ${params.entity}`);
  const { t } = await time(i18nHelper(request), "i18nHelper");
  invariant(params.entity, "Expected params.entity");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, tenantApiKey, userId } = apiAccessValidation;
    const entity = await time(getEntityByIdNameOrSlug({ tenantId: tenant?.id ?? null, idNameOrSlug: params.entity! }), "getEntityByIdNameOrSlug");
    const data = await time(
      RowsApi.get(params.id!, {
        entity,
        tenantId: tenant?.id ?? null,
        userId,
        time,
      }),
      "RowsApi.get"
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
    return json(
      {
        success: true,
        data: ApiHelper.getApiFormatWithRelationships({
          entities: await getAllEntities({ tenantId: tenant?.id ?? null }),
          item: data.item,
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
        setApiKeyLogStatus(apiAccessValidation.tenantApiKey.apiKeyLog.id, {
          error: JSON.stringify(e),
          status: 400,
        }),
        "setApiKeyLogStatus"
      );
    }
    return json({ error: e.message }, { status: 400, headers: getServerTimingHeader() });
  }
};

// PUT OR DELETE
export const action: ActionFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, `[Rows_API_${request.method}] ${params.entity}`);
  invariant(params.entity, "Expected params.entity");
  const { t } = await time(i18nHelper(request), "i18nHelper");
  let apiAccessValidation: ApiAccessValidation | undefined = undefined;
  try {
    apiAccessValidation = await time(validateApiKey(request, params), "validateApiKey");
    const { tenant, tenantApiKey, userId } = apiAccessValidation;
    const entity = await time(getEntityByIdNameOrSlug({ tenantId: tenant?.id ?? null, idNameOrSlug: params.entity! }), "getEntityByIdNameOrSlug");
    const tenantId = tenant?.id ?? null;
    const data = await time(
      RowsApi.get(params.id!, {
        entity,
        tenantId,
        userId,
        time,
      }),
      "RowsApi.get"
    );
    if (!data.item) {
      throw Error(t("shared.notFound"));
    }
    const existing = data.item;
    let jsonBody = "{}";
    if (request.method === "DELETE") {
      await time(
        RowsApi.del(params.id!, {
          entity,
          tenantId,
          userId,
          time,
        }),
        "RowsApi.del"
      );
      if (tenant) {
        await createRowDeletedEvent(tenant.id, {
          id: existing.id,
          entity: { name: entity.name, slug: entity.slug },
          folio: existing.folio,
          tenantId: tenant.id,
          apiKey: {
            id: tenantApiKey?.apiKey.id ?? "",
            alias: tenantApiKey?.apiKey.alias ?? "",
          },
        });
      }
    } else if (request.method === "PUT") {
      jsonBody = await time(request.json(), "request.json");
      const rowValues = ApiHelper.getRowPropertiesFromJson(t, entity, jsonBody, existing);
      await time(
        RowsApi.update(params.id!, {
          entity,
          tenantId: tenant?.id ?? null,
          userId,
          rowValues,
        }),
        "RowsApi.update"
      );
      if (tenant) {
        await createRowUpdatedEvent(tenant.id, {
          id: existing.id,
          entity: { name: entity.name, slug: entity.slug },
          folio: existing.folio,
          new: JSON.stringify(rowValues),
          old: JSON.stringify(existing),
          apiKey: {
            id: tenantApiKey?.apiKey.id ?? "",
            alias: tenantApiKey?.apiKey.alias ?? "",
          },
        });
      }
    } else {
      throw Error("Method not allowed");
    }
    const status = request.method === "DELETE" ? 204 : 200;
    if (tenant && tenantApiKey) {
      await time(
        setApiKeyLogStatus(tenantApiKey.apiKeyLog.id, {
          status,
        }),
        "setApiKeyLogStatus"
      );
      await time(reportUsage(tenant.id, "api"), "reportUsage");
    }
    await time(
      createRowLog(request, {
        tenantId: tenant?.id ?? null,
        createdByApiKey: tenantApiKey?.apiKeyLog.apiKeyId,
        action: request.method === "DELETE" ? DefaultLogActions.Deleted : DefaultLogActions.Updated,
        entity,
        details: JSON.stringify(jsonBody),
        item: request.method === "PUT" ? existing : null,
      }),
      "createRowLog"
    );
    if (request.method === "DELETE") {
      return json({ success: true }, { status, headers: getServerTimingHeader() });
    } else {
      const data = await time(
        RowsApi.get(params.id!, {
          entity,
          time,
        }),
        "RowsApi.get"
      );
      return json(ApiHelper.getApiFormat(entity, data.item), {
        status,
        headers: getServerTimingHeader(),
      });
    }
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
