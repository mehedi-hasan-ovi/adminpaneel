import { ActionFunction, json } from "@remix-run/node";
import { UserProfileUpdatedDto } from "~/application/dtos/events/UserProfileUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as UserProfileUpdatedDto;
      const message = `${body.email} updated their profile`;
      return json({ message }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
