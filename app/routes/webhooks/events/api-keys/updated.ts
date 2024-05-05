import { ActionFunction, json } from "@remix-run/node";
import { ApiKeyUpdatedDto } from "~/application/dtos/events/ApiKeyUpdatedDto";
import { getApiKeyCrudPermissions } from "~/utils/helpers/ApiKeyHelper";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as ApiKeyUpdatedDto;
      // do something with the body 😉
      return json(
        {
          message: `API Key '${body.old.alias}' updated by ${body.user.email} to '${body.new.alias}' with entities: ${body.new.entities
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
