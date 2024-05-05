import { json } from "@remix-run/node";
import { PageBlockActionArgs } from "~/modules/pageBlocks/dtos/PageBlockActionArgs";
import { PageBlockLoaderArgs } from "~/modules/pageBlocks/dtos/PageBlockLoaderArgs";
import { getBlogPost, updateBlogPostPublished } from "~/modules/blog/db/blog.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { baseURL } from "~/utils/url.server";
import { BlockVariableService } from "../../../shared/variables/BlockVariableService.server";
import { BlogPostBlockData } from "./BlogPostBlockUtils";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

export namespace BlogPostBlockService {
  export async function load({ request, params, block }: PageBlockLoaderArgs): Promise<BlogPostBlockData> {
    const postSlug = BlockVariableService.getValue({ request, params, variable: block.blogPost?.variables?.postSlug });
    if (!postSlug) {
      throw new Error("Slug variable not set");
    }
    const userInfo = await getUserInfo(request);
    const user = await getUser(userInfo.userId);
    const post = await getBlogPost({ tenantId: null, idOrSlug: postSlug });
    if (!post) {
      throw Error("Post not found with slug: " + postSlug);
    }
    if (!post.published && (!user || !user.admin)) {
      throw Error("Post not published");
    }
    let metaTags: MetaTagsDto = [
      { title: post.title },
      { name: "description", content: post.description },
      { name: "keywords", content: post.tags.map((postTag) => postTag.tag.name).join(",") },
      { name: "og:image", content: post.image },
      { name: "og:title", content: post.title },
      { name: "og:description", content: post.description },
      { name: "og:url", content: `${baseURL}/blog/${post.slug}` },
      { name: "twitter:image", content: post.image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: post.title },
      { name: "twitter:description", content: post.description },
      {
        tagName: "link",
        rel: "canonical",
        href: `${baseURL}/blog/${post.slug}`,
      },
    ];
    if (block.blogPost?.socials?.twitter) {
      metaTags = [...metaTags, { name: "twitter:site", content: block.blogPost.socials.twitter }];
    }
    if (block.blogPost?.socials?.twitterCreator) {
      metaTags = [...metaTags, { name: "twitter:creator", content: block.blogPost.socials.twitterCreator }];
    }
    return {
      post,
      canEdit: user?.admin !== undefined,
      metaTags,
    };
  }
  export async function publish({ params, form }: PageBlockActionArgs) {
    const postId = form.get("id")?.toString() ?? "";
    const post = await getBlogPost({ tenantId: null, idOrSlug: postId });
    if (!post) {
      throw Error("Post not found");
    }
    await updateBlogPostPublished(post.id ?? "", true);
    return json({});
  }
}
