import type { EntryContext } from "@remix-run/node";
import { isEqual } from "lodash";
import KnowledgeBaseServiceServer from "~/modules/knowledgeBase/service/KnowledgeBaseService.server";
import KnowledgeBaseUtils from "~/modules/knowledgeBase/utils/KnowledgeBaseUtils";
import { getAppConfiguration } from "./db/appConfiguration.db.server";

function typedBoolean<T>(value: T): value is Exclude<T, "" | 0 | false | null | undefined> {
  return Boolean(value);
}

function removeTrailingSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function getDomainUrl(request: Request) {
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");
  if (!host) {
    throw new Error("Could not determine domain URL.");
  }
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

type SitemapEntry = {
  route: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
};
type SitemapHandle = {
  /** this just allows us to identify routes more directly rather than relying on pathnames */
  id?: string;
  /** this is here to allow us to disable scroll restoration until Remix gives us better control */
  restoreScroll?: false;
  getSitemapEntries?: (request: Request) => Promise<Array<SitemapEntry | null> | null> | Array<SitemapEntry | null> | null;
};

async function getSitemapXml(request: Request, remixContext: EntryContext) {
  const appConfiguration = await getAppConfiguration();
  const domainUrl = getDomainUrl(request);

  function getEntry({ route, lastmod, changefreq, priority }: SitemapEntry) {
    return `
<url>
  <loc>${domainUrl}${route}</loc>
  ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
  ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
  ${priority ? `<priority>${priority}</priority>` : ""}
</url>
  `.trim();
  }

  const rawSitemapEntries = (
    await Promise.all(
      Object.entries(remixContext.routeModules).map(async ([id, mod]) => {
        if (id === "root") return;
        if (id.startsWith("routes/_")) return;
        if (id.startsWith("__test_routes__")) return;

        const handle = mod.handle as SitemapHandle | undefined;
        if (handle?.getSitemapEntries) {
          return handle.getSitemapEntries(request);
        }

        // exclude resource routes from the sitemap
        // (these are an opt-in via the getSitemapEntries method)
        if (!("default" in mod)) return;

        const manifestEntry = remixContext.manifest.routes[id];
        if (!manifestEntry) {
          // eslint-disable-next-line no-console
          console.warn(`Could not find a manifest entry for ${id}`);
          return;
        }
        let parentId = manifestEntry.parentId;
        let parent = parentId ? remixContext.manifest.routes[parentId] : null;

        let path;
        if (manifestEntry.path) {
          path = removeTrailingSlash(manifestEntry.path);
        } else if (manifestEntry.index) {
          path = "";
        } else {
          return;
        }

        while (parent) {
          // the root path is '/', so it messes things up if we add another '/'
          const parentPath = parent.path ? removeTrailingSlash(parent.path) : "";
          path = `${parentPath}/${path}`;
          parentId = parent.parentId;
          parent = parentId ? remixContext.manifest.routes[parentId] : null;
        }

        // we can't handle dynamic routes, so if the handle doesn't have a
        // getSitemapEntries function, we just
        if (path.includes(":")) return;
        if (id === "root") return;

        const entry: SitemapEntry = { route: removeTrailingSlash(path) };
        return entry;
      })
    )
  )
    .flatMap((z) => z)
    .filter(typedBoolean);

  const sitemapEntries: Array<SitemapEntry> = [];
  for (const entry of rawSitemapEntries) {
    const existingEntryForRoute = sitemapEntries.find((e) => e.route === entry.route);
    const excludeRoutes = ["/*", "/app", "/admin", "/debug", "/404", "/401", "/new-account", "/api/docs", "/reset"];
    if (!appConfiguration.subscription.allowSignUpBeforeSubscribe) {
      excludeRoutes.push("/register");
    }
    if (excludeRoutes.find((r) => entry.route.startsWith(r))) {
      // eslint-disable-next-line no-console
      // console.log(`Skipping sitemap entry for ${entry.route}`);
    } else if (existingEntryForRoute) {
      if (!isEqual(existingEntryForRoute, entry)) {
        // eslint-disable-next-line no-console
        console.warn(`Duplicate route for ${entry.route} with different sitemap data`, { entry, existingEntryForRoute });
      }
    } else {
      sitemapEntries.push(entry);
    }
  }

  const knowledgeBases = await KnowledgeBaseServiceServer.getAll({
    enabled: true,
  });
  for (const kb of knowledgeBases) {
    // let languages: (string | undefined)[] = kb.languages ?? [kb.defaultLanguage];
    // languages.push(undefined);

    // for (const lang of languages) {
    const kbUrl = KnowledgeBaseUtils.getKbUrl({ kb, params: {} });
    addSitemapEntry(sitemapEntries, {
      route: kbUrl,
      lastmod: kb.updatedAt?.toISOString(),
    });
    const allCategories = await KnowledgeBaseServiceServer.getCategories({
      kb,
      params: {},
    });
    for (const category of allCategories) {
      addSitemapEntry(sitemapEntries, {
        route: KnowledgeBaseUtils.getCategoryUrl({ kb, category, params: {} }),
        lastmod: kb.updatedAt?.toISOString(),
      });
      const allArticles = await KnowledgeBaseServiceServer.getArticles({
        kb,
        language: kb.defaultLanguage,
        categoryId: category.id,
        query: undefined,
        params: {},
      });
      for (const article of allArticles) {
        addSitemapEntry(sitemapEntries, {
          route: KnowledgeBaseUtils.getArticleUrl({ kb, article, params: {} }),
          lastmod: kb.updatedAt?.toISOString(),
        });
      }
    }
  }

  return `
<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
  ${sitemapEntries.map((entry) => getEntry(entry)).join("")}
</urlset>
  `.trim();
}

function addSitemapEntry(sitemapEntries: SitemapEntry[], entry: SitemapEntry) {
  if (sitemapEntries.find((e) => e.route === entry.route)) return;
  sitemapEntries.push(entry);
}

export { getSitemapXml };
