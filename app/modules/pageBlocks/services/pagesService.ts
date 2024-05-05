import { TFunction } from "react-i18next";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { defaultSeoMetaTags } from "../utils/defaultSeoMetaTags";
import { PageBlock, PageMetaTag } from "@prisma/client";
import { getUserInfo, UserSession } from "~/utils/session.server";
import { redirect } from "@remix-run/node";
import { getMetaTags } from "../db/pageMetaTags.db.server";
import { PageWithDetails, getPageBySlug, getPages, createPage } from "../db/pages.db.server";
import { defaultPricingPage } from "../utils/defaultPages/defaultPricingPage";
import { defaultLandingPage } from "../utils/defaultPages/defaultLandingPage";
import { PageConfiguration } from "../dtos/PageConfiguration";
import { PageLoaderData } from "../dtos/PageBlockData";
import { PageBlockService } from "./blocksService";
import { Params } from "@remix-run/react";
import { defaultBlogPage } from "../utils/defaultPages/defaultBlogPage";
import { defaultBlogPostPage } from "../utils/defaultPages/defaultBlogPostPage";

export async function getPageConfiguration({
  request,
  t,
  slug,
  page,
  tenantId,
}: {
  request: Request;
  t?: TFunction;
  slug: string;
  page?: PageWithDetails | null;
  tenantId?: string | null;
}): Promise<PageConfiguration> {
  if (!t) {
    t = (await i18nHelper(request)).t;
  }
  if (!page) {
    page = await getPageBySlug(slug, tenantId ?? null);
  }
  return {
    page,
    name: !page ? slug : page?.slug === "/" ? "Landing" : page?.slug,
    slug: page?.slug ?? slug,
    blocks: await parsePageBlocks({ t, slug, blocks: page?.blocks ?? [] }),
    metaTags: [
      ...(await getPageMetaTags({ t, slug: page?.slug ?? slug, metaTags: page?.metaTags ?? [] })),
      { tagName: "link", rel: "canonical", href: `${process.env.SERVER_URL}${new URL(request.url).pathname}` },
    ],
  };
}

export async function getPageMetaTags({
  t,
  metaTags,
  slug,
  loadDefault = true,
}: {
  t: TFunction;
  metaTags: PageMetaTag[];
  slug?: string;
  loadDefault?: boolean;
}) {
  if (!metaTags || metaTags.length === 0) {
    metaTags = await getMetaTags(null);
  }
  let tags: MetaTagsDto = [];
  if (loadDefault) {
    tags = defaultSeoMetaTags({ t, slug });
  }
  if (metaTags.length > 0) {
    metaTags.forEach((tag) => {
      tags.push({ name: tag.name, content: tag.value });
    });
  }
  return tags;
}

export async function parsePageBlocks({ t, slug, blocks }: { t: TFunction; slug: string; blocks: PageBlock[] }): Promise<PageBlockDto[]> {
  const parsedBlocks: PageBlockDto[] = blocks.map((block) => {
    return JSON.parse(block.value) as PageBlockDto;
  });

  if (parsedBlocks.length !== 0) {
    return parsedBlocks;
  }

  switch (slug) {
    case "/":
      return defaultLandingPage({ t });
    case "/pricing":
      return defaultPricingPage({ t });
    case "/blog":
      return defaultBlogPage({ t });
    case "/blog/:id1":
      return defaultBlogPostPage({ t });
    default:
      return [];
  }
}

export const defaultPages = ["/", "/pricing", "/contact", "/blog", "/blog/:id1", "/newsletter", "/changelog", "/docs"];
export async function createDefaultPages() {
  const allPages = await getPages();
  const existingPages = allPages.map((page) => page.slug);
  return await Promise.all(
    defaultPages
      .filter((page) => !existingPages.includes(page))
      .map(async (slug) => {
        return await createPage({
          slug,
          isPublished: true,
          isPublic: true,
        });
      })
  );
}

export type PagePermissionResult = {
  unauthorized?: {
    redirect?: string;
    error?: string;
  };
};
export function verifyPageVisibility({ page, userSession }: { page: PageWithDetails | null; userSession: UserSession }) {
  const result: PagePermissionResult | undefined = {};
  if (page) {
    if (!page.isPublic && (!userSession.userId || userSession.userId.trim().length === 0)) {
      result.unauthorized = { redirect: "/login", error: "Unauthorized" };
    }
    if (!page.isPublished) {
      result.unauthorized = { redirect: "/404?page=" + page.slug, error: "Page not published" };
    }
  }
  return result;
}

export async function getCurrentPage({
  request,
  params,
  slug,
  tenantId,
}: {
  request: Request;
  params: Params;
  slug: string;
  tenantId?: string;
}): Promise<PageLoaderData> {
  const { t, translations } = await i18nHelper(request);
  const url = new URL(request.url);
  const fullUrl = url.pathname + url.search;
  const page = await getPageConfiguration({ request, t, slug, tenantId });

  const userSession = await getUserInfo(request);
  const { unauthorized } = verifyPageVisibility({ page: page.page, userSession });
  if (unauthorized?.redirect) {
    throw redirect(unauthorized.redirect + "?redirect=" + fullUrl);
  }
  const pageResult: PageLoaderData = {
    ...page,
    userSession,
    authenticated: userSession.userId?.length > 0,
    i18n: translations,
    t,
    blocks: page.blocks,
  };
  return await PageBlockService.load({ request, params, t, page: pageResult });
}
