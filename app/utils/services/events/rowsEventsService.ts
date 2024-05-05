import { RowCommentsCreatedDto } from "~/application/dtos/events/RowCommentsCreatedDto";
import { RowCommentsDeletedDto } from "~/application/dtos/events/RowCommentsDeletedDto";
import { RowCommentsReactedDto } from "~/application/dtos/events/RowCommentsReactedDto";
import { RowCreatedDto } from "~/application/dtos/events/RowCreatedDto";
import { RowDeletedDto } from "~/application/dtos/events/RowDeletedDto";
import { RowSharedDto } from "~/application/dtos/events/RowSharedDto";
import { RowTagsCreatedDto } from "~/application/dtos/events/RowTagsCreatedDto";
import { RowTagsDeletedDto } from "~/application/dtos/events/RowTagsDeletedDto";
import { RowTasksCreatedDto } from "~/application/dtos/events/RowTasksCreatedDto";
import { RowTasksDeletedDto } from "~/application/dtos/events/RowTasksDeletedDto";
import { RowTasksUpdatedDto } from "~/application/dtos/events/RowTasksUpdatedDto";
import { RowUpdatedDto } from "~/application/dtos/events/RowUpdatedDto";
import { RowWorkflowTransitionDto } from "~/application/dtos/events/RowWorkflowTransitionDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import { CreatedByDto } from "~/application/dtos/shared/CreatedByDto";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { getUser } from "~/utils/db/users.db.server";
import NumberUtils from "~/utils/shared/NumberUtils";
import { createApplicationEvent } from ".";

function getUserOrApiKey(item: { user?: { id: string; email: string }; apiKey?: { id: string; alias: string } }) {
  if (item.user) {
    return item.user.email + " ";
  } else if (item.apiKey) {
    return "API Key " + item.apiKey.alias + " ";
  }
  return "";
}

async function getBy(item?: CreatedByDto) {
  if (!item) {
    return "";
  }
  try {
    if (item.byApiKeyId) {
      return "API Key " + item.byApiKeyId + " ";
    } else if (item.byUserId) {
      const user = await getUser(item.byUserId);
      if (user) {
        return user.email + " ";
      } else {
        return "User " + item.byUserId + " ";
      }
    } else if (item.byEmailId) {
      return "Email " + item.byEmailId + " ";
    } else if (item.byEventWebhookAttemptId) {
      return "Webhook Event " + item.byEventWebhookAttemptId + " ";
    }
  } catch (e: any) {
    //
  }
  return "";
}
export async function createRowCreatedEvent(tenantId: string | null, event: RowCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-rows",
    tenantId: null,
    notification: {
      message: `${getUserOrApiKey(event)}created ${event.entity.name} #${NumberUtils.pad(event.folio ?? 0, 4)}`,
      action: { url: `/app/${tenantId}/${event.entity.slug}/${event.id}` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.RowCreated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/created`]);
}

export async function createRowUpdatedEvent(tenantId: string | null, event: RowUpdatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-rows",
    tenantId: null,
    notification: {
      message: `${getUserOrApiKey(event)}updated ${event.entity.name} #${NumberUtils.pad(event.folio ?? 0, 4)}`,
      action: { url: `/app/${tenantId}/${event.entity.slug}/${event.id}` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.RowUpdated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/updated`]);
}

export async function createRowDeletedEvent(tenantId: string | null, event: RowDeletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-rows",
    tenantId: null,
    notification: {
      message: `${getUserOrApiKey(event)}deleted ${event.entity.name} #${NumberUtils.pad(event.folio ?? 0, 4)}`,
      action: { url: `/app/${tenantId}/${event.entity.slug}` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.RowDeleted, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/deleted`]);
}

export async function createRowSharedEvent(tenantId: string | null, event: RowSharedDto) {
  return await createApplicationEvent(ApplicationEvent.RowShared, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/shared`]);
}

export async function createRowTagsCreatedEvent(tenantId: string | null, event: RowTagsCreatedDto) {
  return await createApplicationEvent(ApplicationEvent.RowTagsCreated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/tags/created`]);
}

export async function createRowTagsDeletedEvent(tenantId: string | null, event: RowTagsDeletedDto) {
  return await createApplicationEvent(ApplicationEvent.RowTagsDeleted, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/tags/deleted`]);
}

export async function createRowTasksCreatedEvent(tenantId: string | null, event: RowTasksCreatedDto) {
  return await createApplicationEvent(ApplicationEvent.RowTasksCreated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/tasks/created`]);
}

export async function createRowTasksUpdatedEvent(tenantId: string | null, event: RowTasksUpdatedDto) {
  return await createApplicationEvent(ApplicationEvent.RowTasksUpdated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/tasks/updated`]);
}

export async function createRowTasksDeletedEvent(tenantId: string | null, event: RowTasksDeletedDto) {
  return await createApplicationEvent(ApplicationEvent.RowTasksDeleted, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/rows/tasks/deleted`]);
}

export async function createRowCommentsCreatedEvent(tenantId: string | null, event: RowCommentsCreatedDto) {
  return await createApplicationEvent(ApplicationEvent.RowCommentsCreated, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/rows/comments/created`,
  ]);
}

export async function createRowCommentsReactedEvent(tenantId: string | null, event: RowCommentsReactedDto) {
  return await createApplicationEvent(ApplicationEvent.RowCommentsReacted, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/rows/comments/reacted`,
  ]);
}

export async function createRowCommentsDeletedEvent(tenantId: string | null, event: RowCommentsDeletedDto) {
  return await createApplicationEvent(ApplicationEvent.RowCommentsDeleted, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/rows/comments/deleted`,
  ]);
}

export async function createRowWorkflowTransitionEvent(tenantId: string | null, event: RowWorkflowTransitionDto) {
  await NotificationService.sendToRoles({
    channel: "admin-rows",
    tenantId: null,
    notification: {
      message: `${await getBy(event.by)}moved ${event.entity.name} #${NumberUtils.pad(event.row.folio ?? 0, 4)} to ${event.state.name}`,
      action: { url: `/app/${tenantId}/${event.entity.slug}/${event.row.id}` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.RowWorkflowTransition, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/rows/workflow/transition`,
  ]);
}
