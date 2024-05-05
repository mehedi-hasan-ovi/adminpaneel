import { ActionFunction, json } from "@remix-run/node";
import { GroupUpdatedDto } from "~/application/dtos/events/GroupUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as GroupUpdatedDto;
      // do something with the body 😉
      return json(
        { message: `Group '${body.old.name}' updated by ${body.user.email} with members: ${body.new.members.map((f) => f.email).join(", ")}` },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
