import { ActionFunction, json } from "@remix-run/node";
import { GroupDeletedDto } from "~/application/dtos/events/GroupDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as GroupDeletedDto;
      // do something with the body 😉
      return json(
        { message: `Group '${body.name}' deleted by ${body.user.email} with members: ${body.members.map((f) => f.email).join(", ")}` },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
