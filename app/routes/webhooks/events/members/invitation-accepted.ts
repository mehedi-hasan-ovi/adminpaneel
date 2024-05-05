import { ActionFunction, json } from "@remix-run/node";
import { MemberInvitationAcceptedDto } from "~/application/dtos/events/MemberInvitationAcceptedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as MemberInvitationAcceptedDto;
      // do something with the body 😉
      return json({ message: "Member accepted invitation." }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
