import { ActionFunction, json } from "@remix-run/node";
import { RowTasksCreatedDto } from "~/application/dtos/events/RowTasksCreatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowTasksCreatedDto;
      // do something with the body 😉
      return json(
        {
          message: `Row ${body.rowId} task created '${body.task.name}' by ${
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
