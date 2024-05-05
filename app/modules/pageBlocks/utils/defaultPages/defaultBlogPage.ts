import { TFunction } from "react-i18next";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { defaultHeader } from "../defaultHeader";
import { defaultFooter } from "../defaultFooter";
import { defaultBlogPostsBlock } from "../../components/blocks/marketing/blog/posts/BlogPostsBlockUtils";

export function defaultBlogPage({ t }: { t: TFunction }) {
  const blocks: PageBlockDto[] = [
    // Header
    {
      header: defaultHeader,
    },
    // Heading
    {
      heading: {
        style: "centered",
        headline: t("blog.title"),
        subheadline: t("blog.headline"),
      },
      layout: {
        padding: { y: "py-4" },
      },
    },
    // Pricing
    {
      blogPosts: defaultBlogPostsBlock,
    },
    // Footer
    {
      footer: defaultFooter({ t }),
    },
  ];
  return blocks;
}
