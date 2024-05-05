import type { KbArticleDto } from "../dtos/KbArticleDto";
import type { KbCategoryDto } from "../dtos/KbCategoryDto";
import type { KbSearchResultDto } from "../dtos/KbSearchResultDto";
import type { KnowledgeBaseDto } from "../dtos/KnowledgeBaseDto";
import { KnowledgeBaseWithDetails, getAllKnowledgeBases, getKnowledgeBaseById, getKnowledgeBaseBySlug } from "../db/knowledgeBase.db.server";
import { db } from "~/utils/db.server";
import { KbNavLinkDto } from "../dtos/KbNavLinkDto";
import {
  KnowledgeBaseArticleWithDetails,
  createKnowledgeBaseArticle,
  findKnowledgeBaseArticles,
  getAllKnowledgeBaseArticles,
  getFeaturedKnowledgeBaseArticles,
  getKbArticleById,
  getKbArticleBySlug,
} from "../db/kbArticles.db.server";
import { createKnowledgeBaseCategory, getAllKnowledgeBaseCategories, getKbCategoryById, getKbCategoryBySlug } from "../db/kbCategories.db.server";
import KnowledgeBaseUtils from "../utils/KnowledgeBaseUtils";
import { KnowledgeBaseCategoryWithDetails } from "../helpers/KbCategoryModelHelper";
import { KnowledgeBaseRelatedArticle } from "@prisma/client";
import { marked } from "marked";
import { htmlToText } from "html-to-text";

async function getAll({ enabled }: { enabled?: boolean }): Promise<KnowledgeBaseDto[]> {
  const items = await getAllKnowledgeBases({ enabled });
  return items.map((item) => kbToDto(item));
}

async function get({ slug, enabled }: { slug: string; enabled?: boolean }): Promise<KnowledgeBaseDto> {
  const item = await getKnowledgeBaseBySlug(slug);
  if (!item) {
    throw Error(`Knowledge base not found`);
  }
  if (enabled !== undefined && item.enabled !== enabled) {
    throw Error(`Knowledge base (${item.title}) is not enabled`);
  }
  return kbToDto(item);
}

async function getById(id: string): Promise<KnowledgeBaseDto | null> {
  const item = await getKnowledgeBaseById(id);
  if (!item) {
    return null;
  }
  return kbToDto(item);
}

function kbToDto(kb: KnowledgeBaseWithDetails) {
  const item: KnowledgeBaseDto = {
    id: kb.id,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
    basePath: kb.basePath,
    slug: kb.slug,
    title: kb.title,
    description: kb.description,
    defaultLanguage: kb.defaultLanguage,
    layout: kb.layout as "list" | "articles" | "grid",
    languages: JSON.parse(kb.languages) as string[],
    links: JSON.parse(kb.links) as KbNavLinkDto[],
    color: kb.color,
    enabled: kb.enabled,
    count: {
      articles: kb._count.articles,
      categories: kb._count.categories,
      views: kb._count.views,
    },
    logo: kb.logo,
    seoImage: kb.seoImage,
    metatags: [
      { title: `${kb.title} | ${process.env.APP_NAME}` },
      { name: "description", content: kb.description },
      // { name: "keywords", content: kb.keywords },
      { name: "og:title", content: `${kb.title}` },
      { name: "og:description", content: kb.description },
      { name: "og:image", content: kb.seoImage },
      // { name: "og:url", content: `${new URL(request.url).origin}/${kb.slug}` },
      { name: "twitter:title", content: `${kb.title}` },
      { name: "twitter:description", content: kb.description },
      { name: "twitter:image", content: kb.seoImage },
      { name: "twitter:card", content: "summary_large_image" },
      {
        tagName: "link",
        rel: "canonical",
        href: `${process.env.SERVER_URL}${KnowledgeBaseUtils.getKbUrl({ kb, params: {} })}`,
      },
    ],
  };
  return item;
}

async function getCategories({
  kb,
  params,
}: {
  kb: KnowledgeBaseDto;
  params: {
    lang?: string;
  };
}): Promise<KbCategoryDto[]> {
  const items = await getAllKnowledgeBaseCategories({
    knowledgeBaseSlug: kb.slug,
    language: params.lang || kb.defaultLanguage,
  });
  return items.map((f) => categoryToDto({ kb, category: f, params }));
  // let allItems = await generateFakeData(kb);
  // allItems.categories = allItems.categories.filter((f) => f.language === language);
  // const result = await fakeSearch({ original: allItems, query });
  // allItems.categories.forEach((category) => {
  //   category.articles = allItems.articles;
  // });
  // return result.categories;
}

function categoryToDto({ kb, category, params }: { kb: KnowledgeBaseDto; category: KnowledgeBaseCategoryWithDetails; params: { lang?: string } }) {
  const item: KbCategoryDto = {
    id: category.id,
    slug: category.slug,
    order: category.order,
    title: category.title,
    description: category.description,
    icon: category.icon,
    language: category.language,
    seoImage: category.seoImage,
    href: KnowledgeBaseUtils.getCategoryUrl({ kb, category, params }),
    sections: category.sections.map((f) => ({
      id: f.id,
      order: f.order,
      title: f.title,
      description: f.description,
    })),
    articles: category.articles.map((f) => ({
      id: f.id,
      order: f.order,
      title: f.title,
      description: f.description,
      language: f.language,
      slug: f.slug,
      href: KnowledgeBaseUtils.getArticleUrl({ kb, article: f, params }),
      sectionId: f.sectionId,
    })),
    metatags: [
      { title: `${category.title} | ${kb.title} | ${process.env.APP_NAME}` },
      { name: "description", content: category.description },
      // { name: "keywords", content: category.keywords },
      { name: "og:title", content: `${category.title} | ${kb.title}` },
      { name: "og:description", content: category.description },
      { name: "og:image", content: category.seoImage },
      // { name: "og:url", content: `${process.env.SERVER_URL}/${kb.slug}/categories/${category.slug}` },
      { name: "twitter:title", content: `${category.title} | ${kb.title}` },
      { name: "twitter:description", content: category.description },
      { name: "twitter:image", content: category.seoImage },
      { name: "twitter:card", content: "summary_large_image" },
      {
        tagName: "link",
        rel: "canonical",
        href: `${process.env.SERVER_URL}${KnowledgeBaseUtils.getCategoryUrl({ kb, category, params })}`,
      },
    ],
  };
  return item;
}

async function getArticles({
  kb,
  categoryId,
  language,
  query,
  params,
}: {
  kb: KnowledgeBaseDto;
  categoryId: string;
  language: string;
  query: string | undefined;
  params: { lang?: string };
}): Promise<KbArticleDto[]> {
  const items = await getAllKnowledgeBaseArticles({
    knowledgeBaseSlug: kb.slug,
    categoryId,
    language,
  });
  return items.map((f) => articleToDto({ kb, article: f, relatedArticles: f.relatedArticles, params }));
  // let allItems = await generateFakeData(kb);
  // allItems.articles = allItems.articles.filter((f) => f.language === language);
  // const result = await fakeSearch({ original: allItems, query });
  // return result.articles;
}

async function getArticle({ kb, slug, params }: { kb: KnowledgeBaseDto; slug: string; params: { lang?: string } }): Promise<{
  article: KbArticleDto;
  category: KbCategoryDto;
} | null> {
  let language = params.lang || kb.defaultLanguage;
  const item = await getKbArticleBySlug({
    knowledgeBaseId: kb.id,
    slug,
    language,
  });
  if (!item || !item.publishedAt) {
    return null;
  }
  if (!item.categoryId) {
    return null;
  }
  const category = await getKbCategoryById(item.categoryId);
  if (!category) {
    return null;
  }
  return {
    article: articleToDto({ kb, article: item, relatedArticles: item.relatedArticles, params }),
    category: categoryToDto({ kb, category, params }),
  };
  // const getIdFromSlug = (slug: string) => {
  //   return slug.split("-").pop();
  // };
  // const id = getIdFromSlug(slug);
  // const allItems = await generateFakeData(kb);
  // const article = allItems.articles.find((f) => f.id === id && f.language === language);

  // if (!article) {
  //   return null;
  // }
  // const category = allItems.categories[0];
  // return { article, category };
}

async function getArticleById({ kb, id }: { kb: KnowledgeBaseDto; id: string }): Promise<KbArticleDto | null> {
  const item = await getKbArticleById(id);
  if (!item) {
    return null;
  }
  return articleToDto({ kb, article: item, relatedArticles: item.relatedArticles, params: {} });
}

async function getFeaturedArticles({ kb, params }: { kb: KnowledgeBaseDto; params: { lang?: string } }): Promise<KbArticleDto[]> {
  const items = await getFeaturedKnowledgeBaseArticles({
    knowledgeBaseId: kb.id,
    language: params.lang || kb.defaultLanguage,
  });
  return items.map((f) => articleToDto({ kb, article: f, relatedArticles: f.relatedArticles, params }));
  // let allItems = await generateFakeData(kb);
  // allItems.articles = allItems.articles.filter((f) => f.language === language && f.featuredOrder);
  // // return first 6
  // if (allItems.articles.length <= 4) {
  //   return allItems.articles;
  // }
  // return allItems.articles.slice(0, 4);
}

function articleToDto({
  kb,
  article,
  relatedArticles,
  params,
}: {
  kb: KnowledgeBaseDto;
  article: KnowledgeBaseArticleWithDetails;
  relatedArticles: (KnowledgeBaseRelatedArticle & {
    relatedArticle: { id: string; order: number; title: string; slug: string };
  })[];
  params: { lang?: string };
}) {
  const item: KbArticleDto = {
    id: article.id,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    slug: article.slug,
    title: article.title,
    description: article.description,
    order: article.order,
    contentDraft: article.contentDraft,
    contentPublished: article.contentPublished,
    contentPublishedAsText: article.contentPublishedAsText,
    contentType: article.contentType as "wysiwyg" | "markdown",
    language: article.language,
    featuredOrder: article.featuredOrder,
    createdByUser: article.createdByUser,
    publishedAt: article.publishedAt,
    href: KnowledgeBaseUtils.getArticleUrl({ kb, article, params }),
    sectionId: article.sectionId,
    relatedArticles: relatedArticles.map((f) => ({
      order: f.relatedArticle.order,
      title: f.relatedArticle.title,
      slug: f.relatedArticle.slug,
      href: KnowledgeBaseUtils.getArticleUrl({ kb, article: f.relatedArticle, params }),
    })),
    seoImage: article.seoImage,
    metatags: [
      { title: `${article.title} | ${kb.title} | ${process.env.APP_NAME}` },
      { name: "description", content: article.description },
      // { name: "keywords", content: article.keywords },
      { name: "og:title", content: `${article.title}` },
      { name: "og:description", content: article.description },
      { name: "og:image", content: article.seoImage },
      // { name: "og:url", content: `${process.env.SERVER_URL}/${kb.slug}/articles/${article.slug}` },
      { name: "twitter:title", content: `${article.title}` },
      { name: "twitter:description", content: article.description },
      { name: "twitter:image", content: article.seoImage },
      { name: "twitter:card", content: "summary_large_image" },
      {
        tagName: "link",
        rel: "canonical",
        href: `${process.env.SERVER_URL}${KnowledgeBaseUtils.getArticleUrl({ kb, article, params })}`,
      },
    ],
  };
  return item;
}

async function getCategory({
  kb,
  category,
  language,
  params,
}: {
  kb: KnowledgeBaseDto;
  category: string;
  language: string;
  params: { lang?: string };
}): Promise<KbCategoryDto | null> {
  const item = await getKbCategoryBySlug({
    knowledgeBaseId: kb.id,
    slug: category,
    language,
  });
  if (!item) {
    return null;
  }
  item.articles = item.articles.filter((f) => f.publishedAt);
  return categoryToDto({ kb, category: item, params });
}

async function del(item: KnowledgeBaseDto) {
  const articlesCount = await db.knowledgeBaseArticle.count({
    where: { knowledgeBaseId: item.id },
  });
  const categoriesCount = await db.knowledgeBaseCategory.count({
    where: { knowledgeBaseId: item.id },
  });
  if (articlesCount > 0) {
    throw Error("Cannot delete knowledge base with articles");
  }
  if (categoriesCount > 0) {
    throw Error("Cannot delete knowledge base with categories");
  }
  return await db.knowledgeBase.delete({
    where: { id: item.id },
  });
}

async function duplicateCategory({ kb, language, categoryId }: { kb: KnowledgeBaseDto; language: string; categoryId: string }) {
  const allCategories = await getAllKnowledgeBaseCategories({
    knowledgeBaseSlug: kb.slug,
    language,
  });
  const existing = allCategories.find((p) => p.id === categoryId);
  if (!existing) {
    throw Error("Invalid category");
  }
  let number = 2;
  let slug = "";

  const findExistingSlug = (slug: string) => {
    return allCategories.find((p) => p.slug === slug);
  };

  do {
    slug = `${existing.slug}${number}`;
    const existingWithSlug = findExistingSlug(slug);
    if (!existingWithSlug) {
      break;
    }
    // if (number > 10) {
    //   throw Error("Too many duplicates");
    // }
    number++;
  } while (true);

  let maxOrder = 0;
  if (allCategories.length > 0) {
    maxOrder = Math.max(...allCategories.map((p) => p.order));
  }

  const item = await createKnowledgeBaseCategory({
    knowledgeBaseId: kb.id,
    slug,
    order: maxOrder + 1,
    title: existing.title + " " + number,
    description: existing.description,
    icon: existing.icon,
    language: existing.language,
    seoImage: existing.seoImage,
  });
  return item;
}

async function duplicateArticle({ kb, language, articleId }: { kb: KnowledgeBaseDto; language: string; articleId: string }) {
  const allArticles = await getAllKnowledgeBaseArticles({
    knowledgeBaseSlug: kb.slug,
    language,
  });

  const existing = allArticles.find((p) => p.id === articleId);
  if (!existing) {
    throw Error("Invalid article");
  }

  const { slug, maxOrder, number } = KnowledgeBaseUtils.getAvailableArticleSlug({
    allArticles,
    initialSlug: existing.slug,
  });

  const item = await createKnowledgeBaseArticle({
    knowledgeBaseId: kb.id,
    categoryId: existing.categoryId,
    sectionId: existing.sectionId,
    slug,
    title: existing.title + " " + number,
    description: existing.description,
    order: maxOrder + 1,
    contentDraft: existing.contentDraft,
    contentPublished: existing.contentPublished,
    contentPublishedAsText: existing.contentPublishedAsText,
    contentType: existing.contentType,
    language: existing.language,
    featuredOrder: existing.featuredOrder,
    createdByUserId: existing.createdByUserId,
    seoImage: existing.seoImage,
    publishedAt: null,
  });
  return item;
}

async function search({
  query,
  kb,
  params,
}: {
  query: string | undefined;
  kb: KnowledgeBaseDto;
  params: { lang?: string };
}): Promise<KbSearchResultDto | undefined> {
  if (!query) {
    return undefined;
  }
  const articles = await findKnowledgeBaseArticles({
    knowledgeBaseSlug: kb.slug,
    language: params.lang || kb.defaultLanguage,
    query,
  });
  const result: KbSearchResultDto = {
    articles: articles.map((article) => articleToDto({ kb, article, relatedArticles: [], params })),
    query,
  };
  return result;
}

async function newArticle({
  kb,
  title,
  categoryId,
  sectionId,
  initialSlug = "untitled",
  params,
  userId,
  position,
}: {
  kb: KnowledgeBaseDto;
  title?: string;
  categoryId?: string | null;
  sectionId?: string | null;
  initialSlug?: string;
  params: { lang?: string };
  userId: string;
  position: "first" | "last";
}) {
  const allArticles = await getAllKnowledgeBaseArticles({
    knowledgeBaseSlug: kb.slug,
    language: params.lang || kb.defaultLanguage,
  });
  const { slug, maxOrder, firstOrder, number } = KnowledgeBaseUtils.getAvailableArticleSlug({
    allArticles,
    initialSlug,
  });
  const created = await createKnowledgeBaseArticle({
    knowledgeBaseId: kb.id,
    categoryId: categoryId ?? null,
    sectionId: sectionId ?? null,
    slug,
    title: title ?? `Untitled ${number}`,
    description: "",
    order: position === "first" ? firstOrder - 1 : maxOrder + 1,
    contentDraft: "",
    contentPublished: "",
    contentPublishedAsText: "",
    contentType: "wysiwyg",
    language: params.lang!,
    featuredOrder: null,
    createdByUserId: userId,
    seoImage: "",
    publishedAt: null,
  });
  return created;
}

function contentAsText(text: string) {
  return htmlToText(marked(text), {
    wordwrap: 130,
  });
}

export default {
  getAll,
  get,
  getById,
  getCategories,
  getArticles,
  getArticle,
  getArticleById,
  getFeaturedArticles,
  getCategory,
  del,
  duplicateCategory,
  duplicateArticle,
  search,
  newArticle,
  contentAsText,
};
