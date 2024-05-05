import type { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

export type KbArticleDto = {
  id: string;
  createdAt: Date;
  updatedAt: Date | null;
  slug: string;
  title: string;
  description: string;
  order: number;
  contentDraft: string;
  contentPublished: string;
  contentPublishedAsText: string;
  contentType: "markdown" | "wysiwyg";
  language: string;
  featuredOrder: number | null;
  createdByUser: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  seoImage: string;
  publishedAt: Date | null;
  href: string;
  sectionId: string | null;
  relatedArticles: { order: number; title: string; slug: string; href: string }[];
  metatags: MetaTagsDto;
  // tags: KnowledgeBaseTagDto[];
  // reactions: KnowledgeBaseArticleReactionDto[];
};
