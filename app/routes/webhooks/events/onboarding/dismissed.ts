import { ActionFunction, json } from "@remix-run/node";
import { OnboardingDismissedDto } from "~/application/dtos/events/OnboardingDismissedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as OnboardingDismissedDto;
      return json({ message: `${body.user.email} dismissed onboarding ${body.onboarding.title}` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
