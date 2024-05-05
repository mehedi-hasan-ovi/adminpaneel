import { ActionFunction, json } from "@remix-run/node";
import { RowUpdatedDto } from "~/application/dtos/events/RowUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowUpdatedDto;
      // do something with the body 😉
      return json(
        {
          message: `Row ${body.id} updated by ${body.user ? `${body.user.email}` : body.apiKey ? `API Key ${body.apiKey.alias}` : ""}`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
