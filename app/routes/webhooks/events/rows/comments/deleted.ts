import { ActionFunction, json } from "@remix-run/node";
import { RowCommentsDeletedDto } from "~/application/dtos/events/RowCommentsDeletedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowCommentsDeletedDto;
      // do something with the body 😉
      return json(
        {
          message: `Row ${body.rowId} comment deleted '${body.comment.text}' by ${body.user ? `${body.user.email}` : ""}`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
