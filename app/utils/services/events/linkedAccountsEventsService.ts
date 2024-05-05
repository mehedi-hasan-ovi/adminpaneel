import { LinkedAccountInvitationCreatedDto } from "~/application/dtos/events/LinkedAccountInvitationCreatedDto";
import { LinkedAccountInvitationAcceptedDto } from "~/application/dtos/events/LinkedAccountInvitationAcceptedDto";
import { LinkedAccountInvitationRejectedDto } from "~/application/dtos/events/LinkedAccountInvitationRejectedDto";
import { LinkedAccountDeletedDto } from "~/application/dtos/events/LinkedAccountDeletedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import { createApplicationEvent } from ".";
import NotificationService from "~/modules/notifications/services/NotificationService";

export async function createLinkedAccountInvitationCreatedEvent(tenantId: string, event: LinkedAccountInvitationCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-linked-accounts",
    tenantId: null,
    notification: {
      message: `${event.fromUser.email} invited account ${event.account.email} (${event.account.name})`,
      action: { url: `/app/${tenantId}/settings/linked-accounts` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.LinkedAccountInvitationCreated, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/linked-accounts/invited`,
  ]);
}

export async function createLinkedAccountInvitationAcceptedEvent(tenantId: string, event: LinkedAccountInvitationAcceptedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-linked-accounts",
    tenantId: null,
    notification: {
      message: `${event.account.name} accepted invitation to link`,
      action: { url: `/app/${tenantId}/settings/linked-accounts` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.LinkedAccountInvitationAccepted, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/linked-accounts/invitation-accepted`,
  ]);
}

export async function createLinkedAccountInvitationRejectedEvent(tenantId: string, event: LinkedAccountInvitationRejectedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-linked-accounts",
    tenantId: null,
    notification: {
      message: `${event.account.name} rejected invitation to link`,
      action: { url: `/app/${tenantId}/settings/linked-accounts` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.LinkedAccountInvitationRejected, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/linked-accounts/invitation-rejected`,
  ]);
}

export async function createLinkedAccountDeletedEvent(tenantId: string, event: LinkedAccountDeletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-linked-accounts",
    tenantId: null,
    notification: {
      message: `${event.fromUser.email} deleted linked account ${event.account.name}`,
      action: { url: `/app/${tenantId}/settings/linked-accounts` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.LinkedAccountDeleted, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/linked-accounts/deleted`,
  ]);
}
