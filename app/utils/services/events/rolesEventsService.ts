import { RoleAssignedDto } from "~/application/dtos/events/RoleAssignedDto";
import { RoleUnassignedDto } from "~/application/dtos/events/RoleUnassignedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { baseURL } from "~/utils/url.server";
import { createApplicationEvent } from ".";

export async function createRoleAssignedEvent(tenantId: string, event: RoleAssignedDto) {
  await NotificationService.sendToRoles({
    channel: "roles",
    tenantId,
    notification: {
      message: `${event.fromUser.email} assigned ${event.toUser.email} to the '${event.role.name}' role`,
    },
  });
  return await createApplicationEvent(ApplicationEvent.RoleAssigned, tenantId, event, [baseURL + `/webhooks/events/roles/assigned`]);
}

export async function createRoleUnassignedEvent(tenantId: string, event: RoleUnassignedDto) {
  return await createApplicationEvent(ApplicationEvent.RoleUnassigned, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/roles/unassigned`]);
}
