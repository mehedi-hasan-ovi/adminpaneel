import { ActionFunction, json } from "@remix-run/node";
import { MemberInvitationCreatedDto } from "~/application/dtos/events/MemberInvitationCreatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as MemberInvitationCreatedDto;
      // do something with the body 😉
      return json({ message: "Member invited." }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
