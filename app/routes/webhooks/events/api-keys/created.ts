import { ActionFunction, json } from "@remix-run/node";
import { ApiKeyCreatedDto } from "~/application/dtos/events/ApiKeyCreatedDto";
import { getApiKeyCrudPermissions } from "~/utils/helpers/ApiKeyHelper";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as ApiKeyCreatedDto;
      // do something with the body 😉
      return json(
        {
          message: `API Key '${body.alias}' created by ${body.user.email} with entities: ${body.entities
            .map((f) => f.name + ` (${getApiKeyCrudPermissions(f.create, f.read, f.update, f.delete)})`)
            .join(", ")}`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
