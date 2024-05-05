import { RowsListBlockDto } from "../components/blocks/app/rows/list/RowsListBlockUtils";
import { RowsNewBlockDto } from "../components/blocks/app/rows/new/RowsNewBlockUtils";
import { RowsOverviewBlockDto } from "../components/blocks/app/rows/overview/RowsOverviewBlockUtils";
import { BannerBlockDto } from "../components/blocks/marketing/banner/BannerBlockUtils";
import { BlogPostBlockDto } from "../components/blocks/marketing/blog/post/BlogPostBlockUtils";
import { BlogPostsBlockDto } from "../components/blocks/marketing/blog/posts/BlogPostsBlockUtils";
import { CommunityBlockDto } from "../components/blocks/marketing/community/CommunityBlockUtils";
import { FaqBlockDto } from "../components/blocks/marketing/faq/FaqBlockUtils";
import { FeaturesBlockDto } from "../components/blocks/marketing/features/FeaturesBlockUtils";
import { FooterBlockDto } from "../components/blocks/marketing/footer/FooterBlockUtils";
import { GalleryBlockDto } from "../components/blocks/marketing/gallery/GalleryBlockUtils";
import { HeaderBlockDto } from "../components/blocks/marketing/header/HeaderBlockUtils";
import { HeadingBlockDto } from "../components/blocks/marketing/heading/HeadingBlockUtils";
import { HeroBlockDto } from "../components/blocks/marketing/hero/HeroBlockUtils";
import { LogoCloudsBlockDto } from "../components/blocks/marketing/logoClouds/LogoCloudsBlockUtils";
import { NewsletterBlockDto } from "../components/blocks/marketing/newsletter/NewsletterBlockUtils";
import { PricingBlockDto } from "../components/blocks/marketing/pricing/PricingBlockUtils";
import { TestimonialsBlockDto } from "../components/blocks/marketing/testimonials/TestimonialsBlockUtils";
import { VideoBlockDto } from "../components/blocks/marketing/video/VideoBlockUtils";
import { LayoutBlockDto } from "../components/blocks/shared/layout/LayoutBlockUtils";
import { TemplateBlockDto } from "../components/blocks/_template/TemplateBlockUtils";

export type PageBlockDto = {
  // Shared
  error?: string | null;
  layout?: LayoutBlockDto;
  // Sample
  template?: TemplateBlockDto;
  // Custom blocks
  heading?: HeadingBlockDto;
  banner?: BannerBlockDto;
  header?: HeaderBlockDto;
  footer?: FooterBlockDto;
  hero?: HeroBlockDto;
  gallery?: GalleryBlockDto;
  logoClouds?: LogoCloudsBlockDto;
  video?: VideoBlockDto;
  community?: CommunityBlockDto;
  testimonials?: TestimonialsBlockDto;
  features?: FeaturesBlockDto;
  newsletter?: NewsletterBlockDto;
  faq?: FaqBlockDto;
  pricing?: PricingBlockDto;
  blogPosts?: BlogPostsBlockDto;
  blogPost?: BlogPostBlockDto;
  rowsList?: RowsListBlockDto;
  rowsNew?: RowsNewBlockDto;
  rowsOverview?: RowsOverviewBlockDto;
};
