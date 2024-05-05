import { ActionFunction, json } from "@remix-run/node";
import { LinkedAccountInvitationRejectedDto } from "~/application/dtos/events/LinkedAccountInvitationRejectedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as LinkedAccountInvitationRejectedDto;
      // do something with the body 😉
      return json({ message: `Linked account invitation rejected: ${body.account.name} from ${body.user.email}` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
