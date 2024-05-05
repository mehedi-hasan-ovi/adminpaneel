import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";
import supportedLocales from "~/locale/supportedLocales";
import { db } from "../db.server";
import { baseURL } from "../url.server";

export type AppConfiguration = {
  app: {
    name: string;
    url: string;
    domain: string;
    supportedThemes: "light" | "dark" | "light-and-dark";
    supportedLanguages: string[];
    features: {
      tenantTypes: boolean;
      tenantApiKeys?: boolean;
      tenantEntityProperties?: boolean;
      tenantBlogs: boolean;
      linkedAccounts: boolean; // deprecated, use tenantTypes
    };
  };
  auth: {
    requireEmailVerification: boolean;
    requireOrganization: boolean;
    requireName: boolean;
    recaptcha: {
      enabled: boolean;
      siteKey: string;
    };
    authMethods: {
      emailPassword: {
        enabled: boolean;
      };
      github: {
        enabled: boolean;
        authorizationURL: string;
      };
      google: {
        enabled: boolean;
      };
    };
  };
  analytics: {
    enabled: boolean;
    simpleAnalytics: boolean;
    plausibleAnalytics: boolean;
    googleAnalyticsTrackingId?: string;
  };
  subscription: {
    required: boolean;
    allowSubscribeBeforeSignUp: boolean;
    allowSignUpBeforeSubscribe: boolean;
    defaultBillingPeriod: SubscriptionBillingPeriod;
  };
  cookies: {
    enabled: boolean;
  };
  notifications: {
    enabled: boolean;
    novuAppId?: string;
  };
  onboarding: {
    enabled: boolean;
  };
  featureFlags: {
    enabled: boolean; // load all flags
  };
  metrics: {
    enabled: boolean;
    logToConsole: boolean;
    saveToDatabase: boolean;
    ignoreUrls: string[];
  };
  branding: {
    logo?: string;
    logoDarkMode?: string;
    icon?: string;
    iconDarkMode?: string;
    favicon?: string;
  };
};

export async function getAppConfiguration(): Promise<AppConfiguration> {
  const conf: AppConfiguration = {
    app: {
      name: process.env.APP_NAME?.toString() ?? "",
      url: baseURL,
      domain: process.env.DOMAIN_NAME?.toString() ?? "",
      supportedThemes: "light-and-dark",
      supportedLanguages: supportedLocales.map((l) => l.lang),
      features: {
        tenantApiKeys: true,
        tenantEntityProperties: false,
        tenantTypes: false,
        tenantBlogs: false,
        linkedAccounts: false,
      },
    },
    auth: {
      requireEmailVerification: process.env.AUTH_REQUIRE_VERIFICATION === "true",
      requireOrganization: process.env.AUTH_REQUIRE_ORGANIZATION === "true",
      requireName: process.env.AUTH_REQUIRE_NAME === "true",
      recaptcha: {
        enabled: process.env.AUTH_RECAPTCHA_ENABLED === "true",
        siteKey: process.env.AUTH_RECAPTCHA_SITE_KEY ?? "",
      },
      authMethods: {
        emailPassword: {
          enabled: (process.env.AUTH_METHOD_EMAIL_PASSWORD ?? "true") === "true",
        },
        github: {
          enabled: false,
          authorizationURL: (() => {
            const url = new URL("https://github.com/login/oauth/authorize");
            url.searchParams.append("client_id", process?.env.GITHUB_OAUTH_CLIENT_ID ?? "");
            url.searchParams.append("redirect_uri", baseURL + "/oauth/github/callback");
            url.searchParams.append("scope", ["read:user", "user:email"].join(","));
            return url.toString();
          })(),
        },
        google: {
          enabled: false,
        },
      },
    },
    analytics: {
      enabled: true,
      googleAnalyticsTrackingId: process.env.ANALYTICS_GA_TRACKING_ID,
      simpleAnalytics: false,
      plausibleAnalytics: false,
    },
    subscription: {
      required: false,
      allowSubscribeBeforeSignUp: true,
      allowSignUpBeforeSubscribe: true,
      defaultBillingPeriod: SubscriptionBillingPeriod.MONTHLY,
    },
    cookies: {
      enabled: false,
    },
    notifications: {
      enabled: !!process.env.NOTIFICATIONS_NOVU_APP_ID && !!process.env.NOTIFICATIONS_NOVU_API_KEY,
      novuAppId: process.env.NOTIFICATIONS_NOVU_APP_ID,
    },
    onboarding: {
      enabled: true,
    },
    featureFlags: {
      enabled: true,
    },
    metrics: {
      enabled: false,
      logToConsole: false,
      saveToDatabase: false,
      ignoreUrls: ["/build", "/admin/metrics"],
    },
    branding: {
      logo: undefined, //"https://yahooder.sirv.com/saasrock/logos/remixblocks/logo-light.png",
      logoDarkMode: undefined, //"https://yahooder.sirv.com/saasrock/logos/remixblocks/logo-dark.png",
      icon: undefined, //"https://yahooder.sirv.com/saasrock/logos/remixblocks/icon-light.png",
      iconDarkMode: undefined, //"https://yahooder.sirv.com/saasrock/logos/remixblocks/icon-dark.png",
      favicon: undefined, //"https://yahooder.sirv.com/saasrock/logos/remixblocks/favicon.png",
    },
  };

  return new Promise((resolve) => {
    return db.appConfiguration
      .findFirst()
      .catch(() => {
        resolve(conf);
      })
      .then((appConfiguration) => {
        if (!appConfiguration) {
          return resolve(conf);
        }
        conf.app.name = appConfiguration?.name ?? "";
        conf.app.url = appConfiguration?.url ?? "";

        conf.auth.requireEmailVerification = appConfiguration?.authRequireEmailVerification;
        conf.auth.requireOrganization = appConfiguration?.authRequireOrganization;
        conf.auth.requireName = appConfiguration?.authRequireName;
        conf.auth.recaptcha.enabled = false;
        conf.auth.recaptcha.siteKey = appConfiguration.authRecaptchaSiteKey ?? "";
        if (appConfiguration.authRecaptchaSiteKey) {
          conf.auth.recaptcha.enabled = true;
        }

        conf.analytics.enabled = appConfiguration?.analyticsEnabled;
        conf.analytics.simpleAnalytics = appConfiguration?.analyticsSimpleAnalytics;
        conf.analytics.plausibleAnalytics = appConfiguration?.analyticsPlausibleAnalytics;
        conf.analytics.googleAnalyticsTrackingId = appConfiguration?.analyticsGoogleAnalyticsTrackingId ?? undefined;

        conf.subscription.required = appConfiguration?.subscriptionRequired;
        conf.subscription.allowSubscribeBeforeSignUp = appConfiguration?.subscriptionAllowSubscribeBeforeSignUp;
        conf.subscription.allowSignUpBeforeSubscribe = appConfiguration?.subscriptionAllowSignUpBeforeSubscribe;

        conf.cookies.enabled = appConfiguration?.cookiesEnabled;

        conf.metrics.enabled = appConfiguration?.metricsEnabled;
        conf.metrics.logToConsole = appConfiguration?.metricsLogToConsole;
        conf.metrics.saveToDatabase = appConfiguration?.metricsSaveToDatabase;
        conf.metrics.ignoreUrls = appConfiguration?.metricsIgnoreUrls?.split(",") ?? [];

        conf.branding.logo = appConfiguration?.brandingLogo ?? undefined;
        conf.branding.logoDarkMode = appConfiguration?.brandingLogoDarkMode ?? undefined;
        conf.branding.icon = appConfiguration?.brandingIcon ?? undefined;
        conf.branding.iconDarkMode = appConfiguration?.brandingIconDarkMode ?? undefined;
        conf.branding.favicon = appConfiguration?.brandingFavicon ?? undefined;
        resolve(conf);
      });
  });
}

export async function getOrCreateAppConfiguration() {
  let settings = await db.appConfiguration.findFirst();
  if (!settings) {
    const conf = await getAppConfiguration();
    settings = await db.appConfiguration.create({
      data: {
        name: conf.app.name,
        url: conf.app.url,
        authRequireEmailVerification: conf.auth.requireEmailVerification,
        authRequireOrganization: conf.auth.requireOrganization,
        authRequireName: conf.auth.requireName,
        authRecaptchaSiteKey: conf.auth.recaptcha.siteKey,
        analyticsEnabled: conf.analytics.enabled,
        analyticsSimpleAnalytics: conf.analytics.simpleAnalytics,
        analyticsPlausibleAnalytics: conf.analytics.plausibleAnalytics,
        analyticsGoogleAnalyticsTrackingId: conf.analytics.googleAnalyticsTrackingId,
        subscriptionRequired: conf.subscription.required,
        subscriptionAllowSubscribeBeforeSignUp: conf.subscription.allowSubscribeBeforeSignUp,
        subscriptionAllowSignUpBeforeSubscribe: conf.subscription.allowSignUpBeforeSubscribe,
        cookiesEnabled: conf.cookies.enabled,
        metricsEnabled: conf.metrics.enabled,
        metricsLogToConsole: conf.metrics.logToConsole,
        metricsSaveToDatabase: conf.metrics.saveToDatabase,
        metricsIgnoreUrls: conf.metrics.ignoreUrls.join(","),
        brandingLogo: conf.branding.logo,
        brandingLogoDarkMode: conf.branding.logoDarkMode,
        brandingIcon: conf.branding.icon,
        brandingIconDarkMode: conf.branding.iconDarkMode,
        brandingFavicon: conf.branding.favicon,
      },
    });
  }
  return settings;
}
