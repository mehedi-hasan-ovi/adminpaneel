import { EmailReceivedDto } from "~/application/dtos/events/EmailReceivedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { createApplicationEvent } from ".";

export async function createEmailReceivedEvent(tenantId: string | null, event: EmailReceivedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-emails",
    tenantId: null,
    notification: {
      message: `Email received ${event.subject} from ${event.fromEmail} to ${event.toEmail}`,
      action: { url: `/app/${tenantId}/emails` },
    },
  });
  return await createApplicationEvent(ApplicationEvent.EmailReceived, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/emails/received`]);
}
