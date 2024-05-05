import { Event } from "@prisma/client";
import { createEvent } from "~/utils/db/events/events.db.server";
import { createEventWebhookAttempt, updateEventWebhookAttempt } from "~/utils/db/events/eventWebhookAttempts.db.server";
import { baseURL } from "~/utils/url.server";

export async function createApplicationEvent(name: string, tenantId: string | null, data: any, endpoints?: string[]) {
  const event = await createEvent({
    name,
    tenantId,
    data: JSON.stringify(data),
  });

  if (endpoints) {
    await Promise.all(
      endpoints.map(async (endpoint) => {
        return await callEventEndpoint(event, endpoint, JSON.stringify(data));
      })
    );
  }

  return event;
}

async function callEventEndpoint(event: Event, endpoint: string, body: string) {
  const webhookAttempt = await createEventWebhookAttempt({ eventId: event.id, endpoint });
  try {
    await fetch(baseURL + `/api/events/webhooks/attempts/${webhookAttempt.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  } catch (e: any) {
    // While seeding the database it should not call endpoints
    await updateEventWebhookAttempt(webhookAttempt.id, {
      startedAt: new Date(),
      finishedAt: new Date(),
      success: false,
      status: 500,
      message: "Could not call webhook endpoint: " + e.message,
    });
  }
}
