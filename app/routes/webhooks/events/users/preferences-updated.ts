import { ActionFunction, json } from "@remix-run/node";
import { UserProfileUpdatedDto } from "~/application/dtos/events/UserProfileUpdatedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as UserProfileUpdatedDto;
      // do something with the body 😉
      return json({ message: "Preferences updated" }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
