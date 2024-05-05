import { ActionFunction, json } from "@remix-run/node";
import { SubscriptionSubscribedDto } from "~/application/dtos/events/SubscriptionSubscribedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      const body = (await request.json()) as SubscriptionSubscribedDto;
      const message = `${body.user.email} subscribed`;
      return json(
        {
          message,
          session: body.subscription.session,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
