import { json } from "@remix-run/node";
import { Params, useMatches } from "@remix-run/react";
import { AnalyticsInfoDto } from "~/application/dtos/marketing/AnalyticsInfoDto";
import { commitAnalyticsSession, generateAnalyticsUserId, getAnalyticsSession } from "../analyticsCookie.server";
import { AppConfiguration, getAppConfiguration } from "../db/appConfiguration.db.server";
import AnalyticsHelper from "../helpers/AnalyticsHelper";
import { commitSession, createUserSession, generateCSRFToken, getUserInfo, getUserSession, UserSession } from "../session.server";
import { baseURL } from "../url.server";
import FeatureFlagsService from "~/modules/featureFlags/services/FeatureFlagsService";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { promiseHash } from "../promises/promiseHash";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { getUser } from "../db/users.db.server";
import { ImpersonatingSessionDto } from "~/application/dtos/session/ImpersonatingSessionDto";

export type AppRootData = {
  metaTags: MetaTagsDto;
  serverUrl: string;
  domainName: string;
  userSession: UserSession;
  authenticated: boolean;
  debug: boolean;
  isStripeTest: boolean;
  chatWebsiteId?: string;
  appConfiguration: AppConfiguration;
  csrf?: string;
  analytics?: AnalyticsInfoDto;
  featureFlags: string[];
  impersonatingSession: ImpersonatingSessionDto | null;
};

export function useRootData(): AppRootData {
  return (useMatches().find((f) => f.pathname === "/" || f.pathname === "")?.data ?? {}) as AppRootData;
}

export async function loadRootData({ request, params }: { request: Request; params: Params }) {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "root");
  const { userInfo, session, analyticsSession } = await time(
    promiseHash({
      userInfo: getUserInfo(request),
      session: getUserSession(request),
      analyticsSession: getAnalyticsSession(request),
    }),
    "loadRootData.session"
  );

  const csrf = generateCSRFToken();
  session.set("csrf", csrf);

  let analytics: AnalyticsInfoDto | undefined = undefined;
  const appConfiguration = await time(getAppConfiguration(), "getAppConfiguration");
  if (appConfiguration.analytics.enabled) {
    try {
      analytics = await AnalyticsHelper.getFromRequest(request, userInfo.userId ?? null);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);
    }
  }

  const headers = new Headers();
  let userAnalyticsId = analyticsSession.get("userAnalyticsId");
  headers.append("Set-Cookie", await commitSession(session));
  // if (CookieHelper.hasConsent(userInfo, CookieCategory.ANALYTICS)) {
  if (!userAnalyticsId) {
    userAnalyticsId = generateAnalyticsUserId();
    analyticsSession.set("userAnalyticsId", userAnalyticsId);
  }
  headers.append("Set-Cookie", await commitAnalyticsSession(analyticsSession));
  // } else {
  //   headers.append("Set-Cookie", await destroyAnalyticsSession(analyticsSession));
  // }

  let impersonatingSession: ImpersonatingSessionDto | null = null;
  if (userInfo.impersonatingFromUserId && userInfo.userId?.length > 0) {
    const fromUser = await getUser(userInfo.impersonatingFromUserId);
    const toUser = await getUser(userInfo.userId);
    if (fromUser && toUser) {
      impersonatingSession = { fromUser, toUser };
    }
  }

  const data: AppRootData = {
    metaTags: [{ title: `${process.env.APP_NAME}` }],
    serverUrl: `${baseURL}`,
    domainName: `${process.env.DOMAIN_NAME}`,
    userSession: userInfo,
    authenticated: userInfo.userId?.length > 0,
    debug: process.env.NODE_ENV === "development",
    isStripeTest: process.env.STRIPE_SK?.toString().startsWith("sk_test_") ?? true,
    chatWebsiteId: process.env.CRISP_CHAT_WEBSITE_ID?.toString(),
    appConfiguration,
    csrf,
    analytics,
    featureFlags: appConfiguration.featureFlags.enabled ? await FeatureFlagsService.getCurrentFeatureFlags({ request, params, userAnalyticsId }) : [],
    impersonatingSession,
  };

  const updateLightOrDarkMode = appConfiguration.app.supportedThemes !== "light-and-dark" && userInfo.lightOrDarkMode !== appConfiguration.app.supportedThemes;
  const updateMetrics = userInfo.userId?.length > 0 && appConfiguration.metrics.enabled !== userInfo.metrics?.enabled;
  const needsToUpdateSession = updateLightOrDarkMode || updateMetrics;
  if (needsToUpdateSession) {
    return createUserSession(
      {
        ...userInfo,
        lightOrDarkMode: appConfiguration.app.supportedThemes,
        metrics: appConfiguration.metrics,
      },
      new URL(request.url).pathname
    );
  }

  headers.append("Server-Timing", getServerTimingHeader()["Server-Timing"]);
  return json(data, { headers });
}
