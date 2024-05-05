import { ActionFunction, json } from "@remix-run/node";
import { RowCommentsCreatedDto } from "~/application/dtos/events/RowCommentsCreatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowCommentsCreatedDto;
      // do something with the body 😉
      return json(
        {
          message: `Row ${body.rowId} commented '${body.comment.text}' by ${body.user ? `${body.user.email}` : ""}`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
