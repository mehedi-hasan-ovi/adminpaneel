import { CookieCategory } from "~/application/cookies/CookieCategory";
import { AnalyticsInfoDto } from "~/application/dtos/marketing/AnalyticsInfoDto";
import { db } from "../db.server";
import { AppConfiguration } from "../db/appConfiguration.db.server";
import AnalyticsHelper from "../helpers/AnalyticsHelper";
import CookieHelper from "../helpers/CookieHelper";
import { UserSession } from "../session.server";
import { getUsersById } from "../db/users.db.server";

declare global {
  interface Window {
    gtag?: (option: string, gaTrackingId: string, options: Record<string, unknown>) => void;
  }
}

type AnalyticsProps = {
  url: string;
  rootData: { userSession: UserSession; appConfiguration: AppConfiguration; analytics?: AnalyticsInfoDto };
  route?: string;
};

export async function addPageView({ url, rootData, route }: AnalyticsProps) {
  const gaTrackingId = rootData.appConfiguration?.analytics.googleAnalyticsTrackingId;
  if (CookieHelper.hasConsent(rootData.userSession, CookieCategory.ADVERTISEMENT) && gaTrackingId) {
    // console.log("[PAGE VIEW] Google Analytics");
    if (!window.gtag) {
      // eslint-disable-next-line no-console
      console.warn("window.gtag is not defined. This could mean your google analytics script has not loaded on the page yet.");
    } else {
      window.gtag("config", gaTrackingId, {
        page_path: url,
      });
    }
  }
  if (rootData.analytics) {
    // console.log("[PAGE VIEW]", JSON.stringify({ url, analytics: rootData.analytics }));
    try {
      await fetch("/api/analytics/page-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          route,
          analytics: {
            ...rootData.analytics,
            userAgent: AnalyticsHelper.getUserAgentDetails(),
          },
        }),
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[PAGE VIEW]", e.message);
    }
  }
}

type EventProps = AnalyticsProps & {
  url?: string;
  action: string;
  category: string;
  label: string;
  value: string;
};
export async function addEvent({ url, route, action, category, label, value, rootData }: EventProps) {
  const gaTrackingId = rootData.appConfiguration?.analytics.googleAnalyticsTrackingId;
  if (CookieHelper.hasConsent(rootData.userSession, CookieCategory.ADVERTISEMENT) && gaTrackingId) {
    // console.log("[EVENT] Google Analytics");
    if (!window.gtag) {
      // eslint-disable-next-line no-console
      console.warn("window.gtag is not defined. This could mean your google analytics script has not loaded on the page yet.");
    } else {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }

  if (rootData.analytics) {
    // console.log("[EVENT]", JSON.stringify({ action, category, label, value, url, analytics: rootData.analytics }));
    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          category,
          label,
          value,
          url,
          route,
          analytics: {
            ...rootData.analytics,
            userAgent: AnalyticsHelper.getUserAgentDetails(),
          },
        }),
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[PAGE VIEW]", e.message);
    }
  }
}

export async function getOrCreateUniqueVisitor({
  cookie,
  fromUrl,
  fromRoute,
  analytics,
}: {
  cookie: string;
  fromUrl?: string;
  fromRoute?: string;
  analytics: AnalyticsInfoDto;
}) {
  const visitor = await db.analyticsUniqueVisitor.findUnique({
    where: {
      cookie,
    },
  });
  if (visitor) {
    return visitor;
  }
  // console.log("Creating unique visitor", { referrer: analytics.referrer });
  return await db.analyticsUniqueVisitor.create({
    data: {
      cookie,
      httpReferrer: analytics.referrer?.http,
      via: analytics.referrer?.via,
      browser: analytics.userAgent?.browser.name,
      browserVersion: analytics.userAgent?.browser.version,
      os: analytics.userAgent?.os.family,
      osVersion: analytics.userAgent?.os.version,
      device: analytics.userAgent?.type,
      source: analytics.referrer?.source,
      medium: analytics.referrer?.utm_medium,
      campaign: analytics.referrer?.utm_campaign,
      content: analytics.referrer?.utm_content,
      term: analytics.referrer?.utm_term,
      country: analytics.region?.country,
      city: analytics.region?.city,
      fromUrl,
      fromRoute,
      userId: analytics.userId ?? null,
    },
  });
}

export type AnalyticsOverviewDto = {
  uniqueVisitors: number;
  pageViews: number;
  events: number;
  liveVisitors: number;
  top: {
    sources: { name: string | null; count: number }[];
    httpReferrers: { name: string | null; count: number }[];
    urls: { name: string | null; count: number }[];
    routes: { name: string | null; count: number }[];
    os: { name: string | null; count: number }[];
    devices: { name: string | null; count: number }[];
    countries: { name: string | null; count: number }[];
    via: { name: string | null; count: number }[];
    medium: { name: string | null; count: number }[];
    campaign: { name: string | null; count: number }[];
    user: { name: string | null; count: number }[];
  };
};
export async function getAnalyticsOverview({ withUsers }: { withUsers: boolean }) {
  const uniqueVisitors = await db.analyticsUniqueVisitor.count();
  const pageViews = await db.analyticsPageView.count();
  const events = await db.analyticsEvent.count();
  const liveVisitors = await db.analyticsPageView.groupBy({
    by: ["uniqueVisitorId"],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 1 * 60000),
      },
    },
  });

  const topHttpReferrers = (await db.analyticsUniqueVisitor.groupBy({ by: ["httpReferrer"], _count: true })).map((f) => {
    return { name: f.httpReferrer, count: f._count };
  });
  const topSources = (await db.analyticsUniqueVisitor.groupBy({ by: ["source"], _count: true })).map((f) => {
    return { name: f.source, count: f._count };
  });
  const topUrls = (await db.analyticsPageView.groupBy({ by: ["url"], _count: true })).map((f) => {
    return { name: f.url, count: f._count };
  });
  const topRoutes = (await db.analyticsPageView.groupBy({ by: ["route"], _count: true })).map((f) => {
    return { name: f.route, count: f._count };
  });
  const topOs = (await db.analyticsUniqueVisitor.groupBy({ by: ["os"], _count: true })).map((f) => {
    return { name: f.os, count: f._count };
  });
  const topDevices = (await db.analyticsUniqueVisitor.groupBy({ by: ["device"], _count: true })).map((f) => {
    return { name: f.device, count: f._count };
  });
  const topCountries = (await db.analyticsUniqueVisitor.groupBy({ by: ["country"], _count: true })).map((f) => {
    return { name: f.country, count: f._count };
  });
  const topVia = (await db.analyticsUniqueVisitor.groupBy({ by: ["via"], _count: true })).map((f) => {
    return { name: f.via, count: f._count };
  });
  const topMedium = (await db.analyticsUniqueVisitor.groupBy({ by: ["medium"], _count: true })).map((f) => {
    return { name: f.medium, count: f._count };
  });
  const topCampaign = (await db.analyticsUniqueVisitor.groupBy({ by: ["campaign"], _count: true })).map((f) => {
    return { name: f.campaign, count: f._count };
  });
  let topUserIds: {
    id: string;
    count: number;
  }[] = [];
  if (withUsers) {
    topUserIds = (await db.analyticsUniqueVisitor.groupBy({ by: ["userId"], _count: true })).map((f) => {
      return { id: f.userId ?? "", count: f._count };
    });
  }
  const users = await getUsersById(topUserIds.map((f) => f.id));
  const topUsers = topUserIds.map((f) => {
    const user = users.find((u) => u.id === f.id);
    return { name: user?.email ?? "", count: f.count };
  });

  const data: AnalyticsOverviewDto = {
    uniqueVisitors,
    pageViews,
    events,
    liveVisitors: liveVisitors.length,
    top: {
      httpReferrers: topHttpReferrers.sort((a, b) => b.count - a.count),
      sources: topSources.sort((a, b) => b.count - a.count),
      urls: topUrls.sort((a, b) => b.count - a.count),
      routes: topRoutes.sort((a, b) => b.count - a.count),
      os: topOs.sort((a, b) => b.count - a.count),
      devices: topDevices.sort((a, b) => b.count - a.count),
      countries: topCountries.sort((a, b) => b.count - a.count),
      via: topVia.sort((a, b) => b.count - a.count),
      medium: topMedium.sort((a, b) => b.count - a.count),
      campaign: topCampaign.sort((a, b) => b.count - a.count),
      user: topUsers.sort((a, b) => b.count - a.count),
    },
  };
  return data;
}

export async function getPageViews(filters: {
  url?: {
    startsWith?: string;
    contains?: string;
  };
  route?: {
    startsWith?: string;
    contains?: string;
  };
}) {
  return await db.analyticsPageView.findMany({
    where: {
      OR: [
        { url: { startsWith: filters.url?.startsWith, contains: filters.url?.contains } },
        { route: { startsWith: filters.route?.startsWith, contains: filters.route?.contains } },
      ],
    },
  });
}
