import { ActionFunction, json } from "@remix-run/node";
import { RowTagsDeletedDto } from "~/application/dtos/events/RowTagsDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowTagsDeletedDto;
      // do something with the body 😉
      return json(
        {
          message: `Row ${body.rowId} untagged with ${body.tag.name} (${body.tag.color}) by ${
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
