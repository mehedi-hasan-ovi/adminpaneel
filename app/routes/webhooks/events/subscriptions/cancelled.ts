import { ActionFunction, json } from "@remix-run/node";
import { SubscriptionCancelledDto } from "~/application/dtos/events/SubscriptionCancelledDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as SubscriptionCancelledDto;
      return json({ message: `${body.user.email} cancelled their subscription` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
