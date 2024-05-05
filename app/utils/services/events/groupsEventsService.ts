import { GroupCreatedDto } from "~/application/dtos/events/GroupCreatedDto";
import { GroupDeletedDto } from "~/application/dtos/events/GroupDeletedDto";
import { GroupUpdatedDto } from "~/application/dtos/events/GroupUpdatedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { createApplicationEvent } from ".";

export async function createGroupCreatedEvent(tenantId: string, event: GroupCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-groups",
    tenantId: null,
    notification: {
      message: `${event.user.email} created a group: ${event.name}`,
      action: { url: `/app/${tenantId}/settings/groups` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.GroupCreated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/groups/created`]);
}

export async function createGroupUpdatedEvent(tenantId: string, event: GroupUpdatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-groups",
    tenantId: null,
    notification: {
      message: `${event.user.email} updated a group: ${event.new.name}`,
      action: { url: `/app/${tenantId}/settings/groups` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.GroupUpdated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/groups/updated`]);
}

export async function createGroupDeletedEvent(tenantId: string, event: GroupDeletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-groups",
    tenantId: null,
    notification: {
      message: `${event.user.email} deleted a group: ${event.name}`,
      action: { url: `/app/${tenantId}/settings/groups` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.GroupDeleted, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/groups/deleted`]);
}
