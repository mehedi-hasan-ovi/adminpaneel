import { json, LoaderFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { getOnboardingSessionsWithPagination, OnboardingSessionWithDetails } from "../../db/onboardingSessions.db.server";
import { OnboardingFilterMetadataDto } from "../../dtos/OnboardingFilterMetadataDto";
import OnboardingService, { OnboardingSummaryDto } from "../../services/OnboardingService";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

export namespace OnboardingSummaryApi {
  export type LoaderData = {
    meta: MetaTagsDto;
    summary: OnboardingSummaryDto;
    sessions: {
      items: OnboardingSessionWithDetails[];
      metadata: OnboardingFilterMetadataDto;
    };
  };
  export let loader: LoaderFunction = async ({ request }) => {
    const { t } = await i18nHelper(request);

    const data: LoaderData = {
      meta: [{ title: `${t("onboarding.title")} | ${process.env.APP_NAME}` }],
      summary: await OnboardingService.getSummary(),
      sessions: {
        items: (
          await getOnboardingSessionsWithPagination({
            pagination: { page: 1, pageSize: 10 },
          })
        ).items,
        metadata: await OnboardingService.getMetadata(),
      },
    };
    return json(data);
  };
}
