import { TFunction } from "react-i18next";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

interface SlugTranslations {
  [key: string]: {
    title: string;
    description: string;
  };
}

const slugTranslations: SlugTranslations = {
  "/pricing": {
    title: "front.pricing.title",
    description: "front.pricing.headline",
  },
  "/blog": {
    title: "blog.title",
    description: "blog.headline",
  },
  "/contact": {
    title: "front.contact.title",
    description: "front.contact.headline",
  },
  "/newsletter": {
    title: "front.newsletter.title",
    description: "front.newsletter.headline",
  },
  "/changelog": {
    title: "front.changelog.title",
    description: "front.changelog.headline",
  },
};

export const siteTags = {
  title: "SaasRock | The One-Man SaaS Framework",
  description: "The One-Man SaaS Framework built with Remix, Tailwind CSS, and Prisma.",
  keywords: "remix,saas,tailwindcss,prisma,react,typescript,boilerplate,saas-kit,saas-boilerplate,stripe,postmark,admin-portal,app-dashboard,multi-tenancy",
  image: "https://yahooder.sirv.com/saasfrontends/remix/ss/cover.png",
  thumbnail: "https://yahooder.sirv.com/saasfrontends/remix/thumbnail.png",
  twitterCreator: "@AlexandroMtzG",
  twitterSite: "@saas_rock",
};

export function defaultSeoMetaTags({ t, slug }: { t: TFunction; slug?: string }): MetaTagsDto {
  const tags = slugTranslations[slug || ""] || siteTags;

  if (tags.title.startsWith("front.")) {
    siteTags.title = t(siteTags.title);
  }
  if (tags.description.startsWith("front.")) {
    siteTags.description = t(tags.description);
  }

  return parseMetaTags(siteTags);
}

function parseMetaTags(tags: typeof siteTags): MetaTagsDto {
  return [
    { title: tags.title },
    { name: "description", content: tags.description },
    { name: "keywords", content: tags.keywords },
    { name: "og:title", content: tags.title },
    { name: "og:type", content: "website" },
    { name: "og:image", content: tags.image },
    { name: "og:card", content: "summary_large_image" },
    { name: "og:description", content: tags.description },
    { name: "twitter:image", content: tags.thumbnail },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:creator", content: tags.twitterCreator ?? "" },
    { name: "og:creator", content: tags.twitterCreator },
    { name: "twitter:site", content: tags.twitterSite ?? "" },
    { name: "twitter:title", content: tags.title },
    { name: "twitter:description", content: tags.description },
  ];
}
