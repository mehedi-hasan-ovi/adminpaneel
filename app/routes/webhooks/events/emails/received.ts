import { ActionFunction, json } from "@remix-run/node";
import { EmailReceivedDto } from "~/application/dtos/events/EmailReceivedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as EmailReceivedDto;
      // do something with the body 😉
      return json(
        {
          message: `Email received from ${body.fromEmail} to ${body.toEmail} with subject: ${body.subject}`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
