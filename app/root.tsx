import { ActionFunction, LinksFunction, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useActionData, useLoaderData, useLocation, useMatches } from "@remix-run/react";
import { useSearchParams } from "@remix-run/react";
import styles from "./tailwind.css";
import { useSetupTranslations } from "remix-i18next";
import { createUserSession, getUserInfo } from "./utils/session.server";
import { loadRootData, useRootData } from "./utils/data/useRootData";
import FloatingLoader from "./components/ui/loaders/FloatingLoader";
import CookieConsentBanner from "./components/cookies/CookieConsentBanner";
import { allCookieCategories } from "./application/cookies/ApplicationCookies";
import { CookieCategory } from "./application/cookies/CookieCategory";
import { Fragment, useEffect, useState } from "react";
import { addPageView } from "./utils/services/analyticsService";
import CookieHelper from "./utils/helpers/CookieHelper";
import clsx from "clsx";
import { getUser, updateUserProfile } from "./utils/db/users.db.server";
import ServerError from "./components/ui/errors/ServerError";
import PageMaintenanceMode from "./components/pages/PageMaintenanceMode";
import FeatureFlagTracker from "./modules/featureFlags/components/FeatureFlagTracker";
import { serverTimingHeaders } from "./modules/metrics/utils/defaultHeaders.server";
import BannerBlock from "./modules/pageBlocks/components/blocks/marketing/banner/BannerBlock";
import { useTranslation } from "react-i18next";
import { Toaster } from "react-hot-toast";
export { serverTimingHeaders as headers };

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  return loadRootData({ request, params });
};

export const meta: V2_MetaFunction = ({ data }) => data?.metaTags;

function Document({ children }: { children: React.ReactNode; title?: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const rootData = useRootData();
  const [lastLocation, setLastLocation] = useState("");
  const matches = useMatches();
  const actionData = useActionData();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (lastLocation == location.pathname) {
      return;
    }
    const routeMatch = matches.find((m) => m.pathname == location.pathname);
    setLastLocation(location.pathname);

    async function addView() {
      let params = searchParams ? "?" + searchParams.toString() : "";
      await addPageView({
        url: location.pathname + params,
        route: routeMatch?.id,
        rootData,
      });
    }
    addView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLocation, location, rootData, actionData]);

  return (
    <html lang={rootData.userSession?.lng ?? "en"} className={rootData.userSession?.lightOrDarkMode === "dark" ? "dark" : ""}>
      <head>
        <Meta />
        {rootData.appConfiguration?.branding?.favicon ? (
          <link rel="icon" href={rootData.appConfiguration?.branding?.favicon} />
        ) : (
          <>
            <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          </>
        )}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        {rootData.appConfiguration?.auth.recaptcha.enabled && <script src="https://www.google.com/recaptcha/api.js" async defer></script>}
        {location.pathname.includes("/campaigns") && <link rel="stylesheet" href="https://unpkg.com/react-quill@1.3.3/dist/quill.snow.css" />}

        <Links />
      </head>

      <body
        className={clsx(
          "max-h-full min-h-screen max-w-full bg-white text-gray-800 dark:bg-slate-900 dark:text-white"
          // location.pathname.startsWith("/app") || location.pathname.startsWith("/admin") ? "bg-slate-900" : "bg-white dark:bg-slate-900"
        )}
      >
        {rootData.impersonatingSession && (
          <BannerBlock
            item={{
              style: "top",
              text: t("account.session.impersonating", [rootData.impersonatingSession.toUser.email, rootData.impersonatingSession.fromUser.email]),
              cta: [{ text: t("account.session.logout"), href: "/logout" }],
            }}
          />
        )}
        {rootData.featureFlags?.includes("maintenance") && !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/login") ? (
          <FeatureFlagTracker flag="maintenance">
            <PageMaintenanceMode />
          </FeatureFlagTracker>
        ) : (
          children
        )}

        {!rootData.debug && rootData.appConfiguration?.analytics.enabled && (
          <>
            {rootData.appConfiguration?.analytics.simpleAnalytics && (
              <>
                <script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
                <noscript>
                  <img
                    src="https://queue.simpleanalyticscdn.com/noscript.gif"
                    alt="privacy-friendly-simpleanalytics"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </noscript>
              </>
            )}

            {rootData.appConfiguration?.analytics.plausibleAnalytics && (
              <>
                <script defer data-domain={rootData.domainName} src="https://plausible.io/js/script.js"></script>
              </>
            )}

            {CookieHelper.hasConsent(rootData.userSession, CookieCategory.ADVERTISEMENT) && (
              <>
                {rootData.appConfiguration?.analytics.googleAnalyticsTrackingId && (
                  <>
                    <script async src={`https://www.googletagmanager.com/gtag/js?id=${rootData.appConfiguration?.analytics.googleAnalyticsTrackingId}`} />
                    <script
                      async
                      id="gtag-init"
                      dangerouslySetInnerHTML={{
                        __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${rootData.appConfiguration?.analytics.googleAnalyticsTrackingId}', {
                  page_path: window.location.pathname,
                });
              `,
                      }}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        {rootData.chatWebsiteId &&
          (["/app", "/admin"].some((p) => location.pathname.startsWith(p)) || CookieHelper.hasConsent(rootData.userSession, CookieCategory.FUNCTIONAL)) && (
            <div
              dangerouslySetInnerHTML={{
                __html: `<script type="text/javascript">window.$crisp=[];window.CRISP_WEBSITE_ID="${rootData.chatWebsiteId}";(function(){d = document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>`,
              }}
            ></div>
          )}

        <LiveReload />
        <FloatingLoader />
        <ScrollRestoration />
        <Scripts />
        {rootData.appConfiguration?.cookies.enabled && <CookieConsentBanner />}
      </body>
    </html>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const userInfo = await getUserInfo(request);
  const form = await request.formData();
  const action = form.get("action");
  const redirect = form.get("redirect")?.toString();
  if (action === "toggleLightOrDarkMode") {
    const current = userInfo.lightOrDarkMode ?? "dark";
    const lightOrDarkMode = current === "dark" ? "light" : "dark";
    return createUserSession(
      {
        ...userInfo,
        lightOrDarkMode,
      },
      redirect
    );
  }
  if (action === "setLocale") {
    const lng = form.get("lng")?.toString() ?? "";
    if (userInfo.userId) {
      const user = await getUser(userInfo.userId);
      if (user) {
        await updateUserProfile({ locale: lng }, user.id);
      }
    }
    return createUserSession(
      {
        ...userInfo,
        lng,
      },
      redirect
    );
  }
  if (action === "setCookieConsent") {
    const preserveParams = ["ref", "source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const allowed = form.getAll("cookies[]").map((f) => f.toString());
    const cookies: { category: string; allowed: boolean }[] = [];
    allCookieCategories.forEach((item) => {
      const categoryName = CookieCategory[item];
      const isAllowed = allowed.filter((f) => f.toString() === categoryName.toString()).length > 0;
      cookies.push({ category: CookieCategory[item], allowed: isAllowed ?? item === CookieCategory.REQUIRED });
    });
    const searchParams = new URLSearchParams();
    preserveParams.forEach((param) => {
      const value = form.get(param)?.toString();
      if (value) {
        searchParams.set(param, value);
      }
    });
    return createUserSession(
      {
        ...userInfo,
        cookies,
      },
      redirect + "?" + searchParams.toString()
    );
  }
};

export default function App() {
  let { lng } = useLoaderData<{ lng: string }>();
  useSetupTranslations(lng ?? "en");
  return (
    <Document>
      <Outlet />
      <Toaster />
    </Document>
  );
}

export function ErrorBoundary() {
  return (
    <Document title="Unexpected error">
      <div className="mx-auto p-12 text-center">
        <ServerError />
      </div>
    </Document>
  );
}
