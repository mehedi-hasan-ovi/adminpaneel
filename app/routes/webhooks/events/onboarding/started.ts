import { ActionFunction, json } from "@remix-run/node";
import { OnboardingStartedDto } from "~/application/dtos/events/OnboardingStartedDto";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as OnboardingStartedDto;
      return json({ message: `${body.user.email} started onboarding ${body.onboarding.title}` }, { status: 200 });
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
