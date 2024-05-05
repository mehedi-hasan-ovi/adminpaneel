import { ActionFunction, json } from "@remix-run/node";
import { LinkedAccountInvitationCreatedDto } from "~/application/dtos/events/LinkedAccountInvitationCreatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as LinkedAccountInvitationCreatedDto;
      // do something with the body 😉
      return json({ message: `Invited account to link: ${body.account.name} from ${body.fromUser.email}` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
