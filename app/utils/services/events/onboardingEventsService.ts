import { OnboardingCompletedDto } from "~/application/dtos/events/OnboardingCompletedDto";
import { OnboardingDismissedDto } from "~/application/dtos/events/OnboardingDismissedDto";
import { OnboardingStartedDto } from "~/application/dtos/events/OnboardingStartedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { baseURL } from "~/utils/url.server";
import { createApplicationEvent } from ".";

export async function createOnboardingStartedEvent(tenantId: string | null, event: OnboardingStartedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-onboarding",
    tenantId,
    notification: {
      message: `${event.user.email} started onboarding ${event.onboarding.title}`,
      action: { url: "/admin/onboarding/sessions" },
    },
  });
  return await createApplicationEvent(ApplicationEvent.OnboardingStarted, tenantId, event, [baseURL + `/webhooks/events/onboarding/started`]);
}

export async function createOnboardingDismissedEvent(tenantId: string | null, event: OnboardingDismissedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-onboarding",
    tenantId,
    notification: {
      message: `${event.user.email} dismissed onboarding ${event.onboarding.title}`,
      action: { url: "/admin/onboarding/sessions" },
    },
  });
  return await createApplicationEvent(ApplicationEvent.OnboardingDismissed, tenantId, event, [baseURL + `/webhooks/events/onboarding/dismissed`]);
}

export async function createOnboardingCompletedEvent(tenantId: string | null, event: OnboardingCompletedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-onboarding",
    tenantId,
    notification: {
      message: `${event.user.email} completed onboarding ${event.onboarding.title}`,
      action: { url: "/admin/onboarding/sessions" },
    },
  });
  return await createApplicationEvent(ApplicationEvent.OnboardingCompleted, tenantId, event, [baseURL + `/webhooks/events/onboarding/completed`]);
}
