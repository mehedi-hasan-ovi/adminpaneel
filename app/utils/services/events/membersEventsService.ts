import { MemberDeletedDto } from "~/application/dtos/events/MemberDeletedDto";
import { MemberInvitationAcceptedDto } from "~/application/dtos/events/MemberInvitationAcceptedDto";
import { MemberInvitationCreatedDto } from "~/application/dtos/events/MemberInvitationCreatedDto";
import { MemberUpdatedDto } from "~/application/dtos/events/MemberUpdatedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { baseURL } from "~/utils/url.server";
import { createApplicationEvent } from ".";

export async function createMemberInvitationCreatedEvent(tenantId: string, event: MemberInvitationCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-account-members",
    tenantId: null,
    notification: {
      message: `${event.fromUser.email} invited member ${event.user.email}`,
      action: { url: `/app/${tenantId}/settings/members` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.MemberInvitationCreated, tenantId, event, [baseURL + `/webhooks/events/members/invited`]);
}

export async function createMemberInvitationAcceptedEvent(tenantId: string, event: MemberInvitationAcceptedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-account-members",
    tenantId: null,
    notification: {
      message: `${event.user.email} accepted invitation from ${tenantId}`,
      action: { url: `/app/${tenantId}/settings/members` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.MemberInvitationAccepted, tenantId, event, [
    baseURL + `/webhooks/events/members/invitation-accepted`,
  ]);
}

export async function createMemberUpdatedEvent(tenantId: string, event: MemberUpdatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-account-members",
    tenantId: null,
    notification: {
      message: `${event.fromUser.email} set ${event.user.email} role to ${event.new.type}`,
      action: { url: `/app/${tenantId}/settings/members` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.MemberUpdated, tenantId, event, [baseURL + `/webhooks/events/members/updated`]);
}

export async function createMemberDeletedEvent(tenantId: string, event: MemberDeletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-account-members",
    tenantId: null,
    notification: {
      message: `${event.fromUser.email} removed member ${event.user.email}`,
      action: { url: `/app/${tenantId}/settings/members` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.MemberDeleted, tenantId, event, [baseURL + `/webhooks/events/members/deleted`]);
}
