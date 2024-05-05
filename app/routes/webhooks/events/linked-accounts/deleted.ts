import { ActionFunction, json } from "@remix-run/node";
import { LinkedAccountDeletedDto } from "~/application/dtos/events/LinkedAccountDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as LinkedAccountDeletedDto;
      // do something with the body 😉
      return json({ message: `${body.fromUser.email} deleted the linked account '${body.account.name}'` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
