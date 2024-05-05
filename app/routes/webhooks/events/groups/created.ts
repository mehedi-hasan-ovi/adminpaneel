import { ActionFunction, json } from "@remix-run/node";
import { GroupCreatedDto } from "~/application/dtos/events/GroupCreatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as GroupCreatedDto;
      // do something with the body 😉
      return json(
        { message: `Group '${body.name}' created by ${body.user.email} with members: ${body.members.map((f) => f.email).join(", ")}` },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
