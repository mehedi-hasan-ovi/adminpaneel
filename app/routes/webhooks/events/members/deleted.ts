import { ActionFunction, json } from "@remix-run/node";
import { MemberDeletedDto } from "~/application/dtos/events/MemberDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as MemberDeletedDto;
      // do something with the body 😉
      return json({ message: "Member deleted." }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
