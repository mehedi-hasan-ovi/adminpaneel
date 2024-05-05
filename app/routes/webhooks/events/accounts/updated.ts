import { ActionFunction, json } from "@remix-run/node";
import { AccountUpdatedDto } from "~/application/dtos/events/AccountUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as AccountUpdatedDto;
      // do something with the body 😉
      return json(
        { message: `${body.user.email} updated the account '${body.old.name} (${body.old.slug})' to '${body.new.name} (${body.new.slug})' ` },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
