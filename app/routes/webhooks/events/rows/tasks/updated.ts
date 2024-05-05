import { ActionFunction, json } from "@remix-run/node";
import { RowTasksUpdatedDto } from "~/application/dtos/events/RowTasksUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowTasksUpdatedDto;
      // do something with the body 😉
      let change = "";
      if (body.new.completedAt) {
        change = `completed at ${body.new.completedAt}`;
      } else {
        change = `set as incomplete`;
      }
      return json(
        {
          message: `Row ${body.rowId} task updated '${body.new.name}', ${change}, by ${
            body.user ? `${body.user.email}` : body.apiKey ? `API Key ${body.apiKey.alias}` : ""
          }`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
