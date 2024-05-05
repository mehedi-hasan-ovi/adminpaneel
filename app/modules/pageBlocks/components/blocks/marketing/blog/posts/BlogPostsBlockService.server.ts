import { PageBlockLoaderArgs } from "~/modules/pageBlocks/dtos/PageBlockLoaderArgs";
import { getAllBlogPosts } from "~/modules/blog/db/blog.db.server";

export namespace BlogPostsBlockService {
  export async function load(_: PageBlockLoaderArgs) {
    return await getAllBlogPosts({ tenantId: null, published: true });
  }
}
