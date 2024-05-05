import { ActionFunction, json } from "@remix-run/node";
import { RoleUnassignedDto } from "~/application/dtos/events/RoleUnassignedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RoleUnassignedDto;
      // do something with the body 😉
      return json({ message: `${body.fromUser.email} unassigned the '${body.role.name}' to ${body.toUser.email} 😊!` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
