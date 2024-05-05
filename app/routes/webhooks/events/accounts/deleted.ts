import { ActionFunction, json } from "@remix-run/node";
import { AccountDeletedDto } from "~/application/dtos/events/AccountDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as AccountDeletedDto;
      // do something with the body 😉
      let subscription = "";
      if (body.subscription) {
        subscription = `, ${body.subscription.product.title} - $${body.subscription.price.amount}`;
      }
      return json({ message: `${body.user.email} deleted the account '${body.tenant.name}'${subscription}.` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
