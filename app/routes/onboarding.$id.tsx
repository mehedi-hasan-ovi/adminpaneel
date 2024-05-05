import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Language } from "remix-i18next";
import { i18nHelper } from "~/locale/i18n.utils";
import { getOnboardingSession, OnboardingSessionWithDetails } from "~/modules/onboarding/db/onboardingSessions.db.server";
import { OnboardingSessionActionDto } from "~/modules/onboarding/dtos/OnboardingSessionActionDto";
import OnboardingSessionService from "~/modules/onboarding/services/OnboardingSessionService";

type LoaderData = {
  item: OnboardingSessionWithDetails | null;
  i18n: Record<string, Language>;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const { translations } = await i18nHelper(request);
  const item = await getOnboardingSession(params.id!);
  const data: LoaderData = {
    item,
    i18n: translations,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  const formData = await request.formData();
  const actionName = formData.get("action");
  const sessionId = params.id!;
  const session = await getOnboardingSession(sessionId);
  if (!session) {
    return json({ error: "Session not found" }, { status: 404 });
  }
  const actions = formData.getAll("actions[]").map((action: FormDataEntryValue) => {
    return JSON.parse(action.toString()) as OnboardingSessionActionDto;
  });
  switch (actionName) {
    case "started": {
      await OnboardingSessionService.started(session);
      break;
    }
    case "dismissed": {
      await OnboardingSessionService.dismissed(session);
      break;
    }
    case "add-actions": {
      await OnboardingSessionService.addActions(session, { actions });
      break;
    }
    case "set-step": {
      await OnboardingSessionService.setStep(session, {
        fromIdx: Number(formData.get("fromIdx")),
        toIdx: Number(formData.get("toIdx")),
        actions,
      });
      break;
    }
    case "complete": {
      await OnboardingSessionService.complete(session, {
        fromIdx: Number(formData.get("fromIdx")),
        actions,
      });
      break;
    }
    default: {
      return json({ error: t("shared.invalidForm") }, { status: 400 });
    }
  }
  return json({});
};
