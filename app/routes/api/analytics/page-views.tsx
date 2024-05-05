import { AnalyticsUniqueVisitor } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { AnalyticsInfoDto } from "~/application/dtos/marketing/AnalyticsInfoDto";
import { getAnalyticsInfo } from "~/utils/analyticsCookie.server";
import { db } from "~/utils/db.server";
import { getOrCreateUniqueVisitor } from "~/utils/services/analyticsService";

// const ignoreUrl = ["/admin/analytics"];
export const action: ActionFunction = async ({ request, params }) => {
  try {
    // const userInfo = await getUserInfo(request);
    // if (!CookieHelper.hasConsent(userInfo, CookieCategory.ANALYTICS)) {
    //   return json({ error: "User has not consented to analytics" }, 400);
    // }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }
    const analyticsSessionInfo = await getAnalyticsInfo(request);
    if (!analyticsSessionInfo?.userAnalyticsId) {
      return json({ error: "Invalid Analytics Cookie" }, { status: 401 });
    }

    const jsonBody = (await request.json()) as {
      url: string;
      route: string;
      analytics: AnalyticsInfoDto;
    };

    const settings = await db.analyticsSettings.findFirst({});
    const ignoredPages = settings?.ignorePages?.split(",") ?? [];

    if (ignoredPages.find((f) => f !== "" && jsonBody.url.includes(f))) {
      return json({ error: "Ingored URL" }, { status: 400 });
    }
    const uniqueVisitor = await getOrCreateUniqueVisitor({
      cookie: analyticsSessionInfo?.userAnalyticsId,
      fromUrl: jsonBody.url,
      fromRoute: jsonBody.route,
      analytics: jsonBody.analytics,
    });
    if (!uniqueVisitor) {
      throw new Error("Unique visitor not found");
    }
    await updateUniqueVisitorSource(uniqueVisitor, jsonBody.analytics);
    await db.analyticsPageView.create({
      data: {
        uniqueVisitorId: uniqueVisitor.id,
        url: jsonBody.url,
        route: jsonBody.route,
      },
    });

    return json({ success: true }, { status: 201 });
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};

async function updateUniqueVisitorSource(uniqueVisitor: AnalyticsUniqueVisitor, analytics: AnalyticsInfoDto) {
  if (analytics.referrer?.source && uniqueVisitor.source !== analytics.referrer?.source) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { source: analytics.referrer?.source } });
  }
  if (analytics.referrer?.utm_medium && uniqueVisitor.medium !== analytics.referrer?.utm_medium) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { medium: analytics.referrer?.utm_medium } });
  }
  if (analytics.referrer?.utm_campaign && uniqueVisitor.medium !== analytics.referrer?.utm_campaign) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { medium: analytics.referrer?.utm_campaign } });
  }
  if (analytics.referrer?.utm_content && uniqueVisitor.medium !== analytics.referrer?.utm_content) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { medium: analytics.referrer?.utm_content } });
  }
  if (analytics.referrer?.utm_term && uniqueVisitor.medium !== analytics.referrer?.utm_term) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { medium: analytics.referrer?.utm_term } });
  }
  if (analytics.userId && uniqueVisitor.userId !== analytics.userId) {
    await db.analyticsUniqueVisitor.update({ where: { id: uniqueVisitor.id }, data: { userId: analytics.userId } });
  }
}
