import UrlUtils from "~/utils/app/UrlUtils";
import { KnowledgeBaseArticleWithDetails } from "../db/kbArticles.db.server";

const defaultLanguage = "en";
const supportedLanguages: { name: string; value: string }[] = [
  { name: "English", value: "en" },
  { name: "Spanish", value: "es" },
];

function getLanguageName(language: string) {
  const supportedLanguage = supportedLanguages.find((l) => l.value === language);
  return supportedLanguage ? supportedLanguage.name : "";
}

function getAvailableArticleSlug({ allArticles, initialSlug }: { allArticles: KnowledgeBaseArticleWithDetails[]; initialSlug: string }) {
  let number = 1;
  let slug = "";

  const findExistingSlug = (slug: string) => {
    return allArticles.find((p) => p.slug === slug);
  };

  do {
    slug = `${initialSlug}-${number}`;
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
  let firstOrder = 0;
  if (allArticles.length > 0) {
    maxOrder = Math.max(...allArticles.map((p) => p.order));
    firstOrder = Math.min(...allArticles.map((p) => p.order));
  }
  return {
    slug,
    maxOrder,
    firstOrder,
    number,
  };
}

function getKbUrl({ kb, params }: { kb: { basePath: string; slug: string }; params: { lang?: string } }) {
  let url = UrlUtils.join(kb.basePath, kb.slug);
  const foundLang = supportedLanguages.find((l) => l.value === params.lang);
  if (params.lang && foundLang) {
    return `${url}/${params.lang}`;
  }
  return `${url}`;
}

function getArticleUrl({ kb, article, params }: { kb: { slug: string; basePath: string }; article: { slug: string }; params: { lang?: string } }) {
  let kbUrl = getKbUrl({ kb, params });
  return `${kbUrl}/articles/${article.slug}`;
}

function getCategoryUrl({ kb, category, params }: { kb: { slug: string; basePath: string }; category: { slug: string }; params: { lang?: string } }) {
  let kbUrl = getKbUrl({ kb, params });
  return `${kbUrl}/categories/${category.slug}`;
}

export default {
  defaultLanguage,
  supportedLanguages,
  getLanguageName,
  getAvailableArticleSlug,
  getKbUrl,
  getArticleUrl,
  getCategoryUrl,
};
