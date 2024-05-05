import { ActionFunction, json } from "@remix-run/node";
import { RowSharedDto } from "~/application/dtos/events/RowSharedDto";
import { getRowPermissionsDescription } from "~/utils/helpers/PermissionsHelper";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowSharedDto;
      // do something with the body 😉
      let permissions = "";
      if (body.permissions.length > 0) {
        permissions = ": " + getRowPermissionsDescription(body.permissions).join(", ");
      }
      return json(
        {
          message: `Row ${body.id} set to '${body.visibility}' with folio ${body.folio} by ${
            body.user ? `${body.user.email}` : body.apiKey ? `API Key ${body.apiKey.alias}` : ""
          }${permissions}.`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
