import { UserPasswordUpdatedDto } from "~/application/dtos/events/UserPasswordUpdatedDto";
import { UserPreferencesUpdatedDto } from "~/application/dtos/events/UserPreferencesUpdatedDto";
import { UserProfileDeletedDto } from "~/application/dtos/events/UserProfileDeletedDto";
import { UserProfileUpdatedDto } from "~/application/dtos/events/UserProfileUpdatedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { baseURL } from "~/utils/url.server";
import { createApplicationEvent } from ".";

export async function createUserProfileUpdatedEvent(tenantId: string, event: UserProfileUpdatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-users",
    tenantId: null,
    notification: {
      message: `${event.email} updated their profile`,
    },
  });
  return await createApplicationEvent(ApplicationEvent.UserProfileUpdated, tenantId, event, [baseURL + `/webhooks/events/users/profile-updated`]);
}

export async function createUserProfileDeletedEvent(tenantId: string | null, event: UserProfileDeletedDto) {
  return await createApplicationEvent(ApplicationEvent.UserProfileDeleted, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/users/profile-deleted`,
  ]);
}

export async function createUserPasswordUpdatedEvent(tenantId: string | null, event: UserPasswordUpdatedDto) {
  return await createApplicationEvent(ApplicationEvent.UserPasswordUpdated, tenantId, event, [
    process.env.SERVER_URL + `/webhooks/events/users/password-updated`,
  ]);
}

export async function createUserPreferencesUpdatedEvent(event: UserPreferencesUpdatedDto) {
  return await createApplicationEvent(ApplicationEvent.UserPreferencesUpdated, null, event, [
    process.env.SERVER_URL + `/webhooks/events/users/preferences-updated`,
  ]);
}
