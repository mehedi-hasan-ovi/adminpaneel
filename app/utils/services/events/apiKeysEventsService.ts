import { ApiKeyCreatedDto } from "~/application/dtos/events/ApiKeyCreatedDto";
import { ApiKeyDeletedDto } from "~/application/dtos/events/ApiKeyDeletedDto";
import { ApiKeyUpdatedDto } from "~/application/dtos/events/ApiKeyUpdatedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { createApplicationEvent } from ".";

export async function createApiKeyCreatedEvent(tenantId: string, event: ApiKeyCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-api-keys",
    tenantId: null,
    notification: {
      message: `${event.user.email} created a new API key: ${event.alias}`,
      action: { url: `/app/${tenantId}/settings/api/keys` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.ApiKeyCreated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/api-keys/created`]);
}

export async function createApiKeyUpdatedEvent(tenantId: string, event: ApiKeyUpdatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-api-keys",
    tenantId: null,
    notification: {
      message: `${event.user.email} updated API key: ${event.new.alias}`,
      action: { url: `/app/${tenantId}/settings/api/keys` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.ApiKeyUpdated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/api-keys/updated`]);
}

export async function createApiKeyDeletedEvent(tenantId: string, event: ApiKeyDeletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-api-keys",
    tenantId: null,
    notification: {
      message: `${event.user.email} deleted API key: ${event.alias}`,
      action: { url: `/app/${tenantId}/settings/api/keys` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.ApiKeyDeleted, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/api-keys/deleted`]);
}
