import { FeatureFlag } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { AnalyticsInfoDto } from "~/application/dtos/marketing/AnalyticsInfoDto";
import { getAnalyticsInfo } from "~/utils/analyticsCookie.server";
import { db } from "~/utils/db.server";
import { getOrCreateUniqueVisitor } from "~/utils/services/analyticsService";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }
    const analyticsSessionInfo = await getAnalyticsInfo(request);
    if (!analyticsSessionInfo?.userAnalyticsId) {
      return json({ error: "Invalid Analytics Cookie" }, { status: 401 });
    }

    const jsonBody = (await request.json()) as {
      action: string;
      category: string;
      label: string;
      value: string;
      url: string | undefined;
      route: string | undefined;
      analytics: AnalyticsInfoDto;
      featureFlagId: string | undefined;
    };

    const uniqueVisitor = await getOrCreateUniqueVisitor({
      cookie: analyticsSessionInfo?.userAnalyticsId,
      fromUrl: jsonBody.url,
      fromRoute: jsonBody.route,
      analytics: jsonBody.analytics,
    });
    if (!uniqueVisitor) {
      throw new Error("Unique visitor not found");
    }
    let featureFlag: FeatureFlag | null = null;
    if (jsonBody.category === "featureFlag") {
      featureFlag = await db.featureFlag.findFirst({ where: { name: jsonBody.action } });
    }
    await db.analyticsEvent.create({
      data: {
        uniqueVisitorId: uniqueVisitor.id,
        action: jsonBody.action,
        category: jsonBody.category,
        label: jsonBody.label,
        value: jsonBody.value,
        url: jsonBody.url,
        route: jsonBody.route,
        featureFlagId: featureFlag?.id,
      },
    });

    return json({ success: true }, { status: 201 });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("Error in analytics events", e.message);
    return json({ error: e.message }, { status: 400 });
  }
};
