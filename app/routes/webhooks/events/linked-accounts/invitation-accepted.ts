import { ActionFunction, json } from "@remix-run/node";
import { LinkedAccountInvitationAcceptedDto } from "~/application/dtos/events/LinkedAccountInvitationAcceptedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as LinkedAccountInvitationAcceptedDto;
      // do something with the body 😉
      return json({ message: `Linked account invitation accepted: ${body.account.name} from ${body.user.email}` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
