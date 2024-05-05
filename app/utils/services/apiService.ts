import { Params } from "react-router";
import { json } from "@remix-run/node";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { ApiKeyWithDetails, createApiKeyLog, getApiKey, setApiKeyLogStatus } from "../db/apiKeys.db.server";
import { getEntityBySlug } from "../db/entities/entities.db.server";
import { getPlanFeatureUsage } from "./subscriptionService";
import { getMyTenants, getTenantByIdOrSlug } from "../db/tenants.db.server";
import { ApiKeyLog, Tenant } from "@prisma/client";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { createUniqueTenantIpAddress } from "../db/tenants/tenantIpAddress.db.server";
import { getClientIPAddress } from "../server/IpUtils";
import jwt from "jsonwebtoken";
import { getUser } from "../db/users.db.server";

async function setApiError(request: Request, params: Params, error: string, status: number, apiKeyLogId?: string) {
  if (apiKeyLogId) {
    await setApiKeyLogStatus(apiKeyLogId, {
      error,
      status,
    });
  } else {
    await createApiKeyLog(request, params, {
      apiKeyId: null,
      endpoint: new URL(request.url).pathname,
      error,
      status,
    });
  }
  return json({ error }, { status });
}

export type ApiAccessValidation = {
  userId?: string;
  tenant: Tenant | null;
  tenantApiKey?: {
    apiKey: ApiKeyWithDetails;
    apiKeyLog: ApiKeyLog;
    usage: PlanFeatureUsageDto | undefined;
  };
};
export async function validateApiKey(request: Request, params: Params): Promise<ApiAccessValidation> {
  const authorization = request.headers.get("Authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    const token = authorization.split(" ")[1];
    let userId = "";
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      userId = decoded.userId;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log("Invalid authorization token: " + e.message);
      throw Error("Invalid authorization token: " + e.message);
    }
    const user = await getUser(userId);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log("User not found");
      throw Error("Unauthorized");
    }
    let tenantId = request.headers.get("X-Account-Id") ?? request.headers.get("X-Tenant-Id");
    if (!tenantId) {
      if (!user.admin) {
        // eslint-disable-next-line no-console
        console.log("No X-Account-Id provided");
        throw Error("No X-Account-Id provided");
      } else {
        tenantId = null;
      }
    }
    if (tenantId !== null) {
      const userTenants = await getMyTenants(user.id);
      if (!userTenants.find((t) => t.id === tenantId || t.slug === tenantId)) {
        // eslint-disable-next-line no-console
        console.log(`User ${user.email} is not a member of ${tenantId}`);
        throw Error("Unauthorized");
      }
    }
    const tenant = await getTenantByIdOrSlug(tenantId ?? "");
    return {
      userId,
      tenant: tenantId === null ? null : tenant,
    };
  }
  const apiKeyFromHeaders = request.headers.get("X-Api-Key") ?? "";
  if (!apiKeyFromHeaders) {
    // eslint-disable-next-line no-console
    console.log("No X-API-Key header or Authorization token provided");
    throw Error("No X-API-Key header or Authorization token provided");
  }
  const searchParams = new URL(request.url).searchParams;
  if (apiKeyFromHeaders === process.env.API_ACCESS_TOKEN && process.env.API_ACCESS_TOKEN.toString().length > 0) {
    const tenantId = searchParams.get("tenantId");
    if (!tenantId) {
      return { tenant: null };
    }
    const tenant = await getTenantByIdOrSlug(tenantId);
    if (!tenant) {
      // eslint-disable-next-line no-console
      console.log("Account not found: " + tenantId);
      throw Error("Account not found: " + tenantId);
    }
    return { tenant };
  }
  if (searchParams.get("tenantId")) {
    // eslint-disable-next-line no-console
    console.log("You cannot use tenantId with an API key");
    throw Error("You cannot use tenantId with an API key");
  }
  return validateTenantApiKey(request, params);
}

export async function validateTenantApiKey(request: Request, params: Params): Promise<ApiAccessValidation> {
  const apiKeyFromHeaders = request.headers.get("X-Api-Key") ?? "";
  const apiKey = await getApiKey(apiKeyFromHeaders);
  if (!apiKey) {
    throw await setApiError(request, params, "Invalid API Key", 401);
  }

  // Store IP Address
  await createUniqueTenantIpAddress({
    ip: getClientIPAddress(request) ?? "Unknown",
    fromUrl: new URL(request.url).pathname,
    tenantId: apiKey.tenantId,
    apiKeyId: apiKey.id,
  });

  const apiKeyLog = await createApiKeyLog(request, params, {
    endpoint: new URL(request.url).pathname,
    apiKeyId: apiKey.id,
  });
  if (!apiKey.active) {
    throw await setApiError(request, params, "Inactive API Key", 400, apiKeyLog.id);
  }
  if (apiKey.expires && apiKey?.expires < new Date()) {
    throw await setApiError(request, params, "Expired API Key", 400, apiKeyLog.id);
  }
  const usage = await getPlanFeatureUsage(apiKey.tenantId, DefaultFeatures.API);
  if (usage && !usage.enabled) {
    throw await setApiError(request, params, usage.message, 429, apiKeyLog.id);
  }
  // eslint-disable-next-line no-console
  console.log({
    method: request.method,
    pathname: new URL(request.url).pathname,
    params,
    tenant: apiKey.tenant.name,
    apiKeyRemainingQuota: usage?.remaining,
  });

  return {
    tenant: apiKey.tenant,
    tenantApiKey: {
      apiKey,
      apiKeyLog,
      usage,
    },
  };
}

export async function getEntityApiKeyFromRequest(request: Request, params: Params) {
  const { tenant, tenantApiKey } = await validateApiKey(request, params);
  const entity = await getEntityBySlug({ tenantId: tenant?.id ?? null, slug: params.entity ?? "" });
  if (!tenantApiKey) {
    return { tenant, entity };
  }
  const { apiKey, apiKeyLog, usage } = tenantApiKey!;
  if (!entity) {
    throw await setApiError(request, params, "Invalid entity", 400, apiKeyLog.id);
  }
  if (!entity.hasApi) {
    throw await setApiError(request, params, `${entity.name} does not have the API enabled`, 400, apiKeyLog.id);
  }
  const permission = apiKey.entities.find((f) => f.entityId === entity.id);
  if (!permission) {
    throw await setApiError(request, params, `API Key does not have access to ${entity.slug}`, 403, apiKeyLog.id);
  }
  if (request.method === "GET" && !permission.read) {
    throw new Error(`API Key does not have permission to read ${permission.entity.slug}`);
  } else if (request.method === "POST" && !permission.create) {
    throw new Error(`API Key does not have permission to create ${permission.entity.slug}`);
  } else if (request.method === "PUT" && !permission.update) {
    throw new Error(`API Key does not have permission to update ${permission.entity.slug}`);
  } else if (request.method === "DELETE" && !permission.delete) {
    throw new Error(`API Key does not have permission to delete ${permission.entity.slug}`);
  }
  return {
    apiKey,
    entity,
    tenant: apiKey.tenant,
    apiKeyLog,
    usage,
  };
}
