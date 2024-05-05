import { BlogCategory, BlogTag } from "@prisma/client";
import { V2_MetaFunction, LoaderFunction, json, ActionFunction, redirect } from "@remix-run/node";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { getAllBlogCategories } from "../../db/blogCategories.db.server";
import { getAllBlogTags } from "../../db/blogTags.db.server";
import { i18nHelper } from "~/locale/i18n.utils";
import { BlogApi } from "~/utils/api/BlogApi";
import { storeSupabaseFile } from "~/utils/integrations/supabaseService";
import { getUserInfo } from "~/utils/session.server";
import { BlogPostWithDetails, createBlogPost } from "../../db/blog.db.server";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import UrlUtils from "~/utils/app/UrlUtils";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";

export namespace BlogRoutesNewApi {
  export const meta: V2_MetaFunction = ({ data }) => data?.metatags;

  export type LoaderData = {
    metatags: MetaTagsDto;
    categories: BlogCategory[];
    tags: BlogTag[];
    featureUsageEntity: PlanFeatureUsageDto | undefined;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const tenantId = await getTenantIdOrNull({ request, params });
    if (tenantId === null) {
      await verifyUserHasPermission(request, "admin.blog.create");
    }
    const featureUsageEntity = tenantId ? await getPlanFeatureUsage(tenantId, DefaultFeatures.BlogPosts) : undefined;
    const data: LoaderData = {
      metatags: [{ title: `Blog | ${process.env.APP_NAME}` }],
      categories: await getAllBlogCategories(tenantId),
      tags: await getAllBlogTags(tenantId),
      featureUsageEntity,
    };
    return json(data);
  };

  export type ActionData = {
    error?: string;
    createdPost?: BlogPostWithDetails | null;
  };
  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const userInfo = await getUserInfo(request);
    const form = await request.formData();
    const action = form.get("action")?.toString() ?? "";
    const content = form.get("content")?.toString() ?? "";
    if (action === "create") {
      const title = form.get("title")?.toString() ?? "";
      const slug = form.get("slug")?.toString() ?? "";
      const description = form.get("description")?.toString() ?? "";
      const date = form.get("date")?.toString() ?? "";
      const image = form.get("image")?.toString() ?? "";
      const published = Boolean(form.get("published"));
      const readingTime = form.get("reading-time")?.toString() ?? "";
      const categoryId = form.get("category")?.toString() ?? "";
      const tags = form.get("tags")?.toString() ?? "";
      const contentType = form.get("contentType")?.toString() ?? "";
      const addingCategoryName = form.get("new-category")?.toString() ?? "";

      try {
        let category: BlogCategory | null = null;
        if (addingCategoryName) {
          category = await BlogApi.getCategory({ tenantId, idOrName: { name: addingCategoryName } });
          if (!category) {
            category = await BlogApi.createCategory({ tenantId, name: addingCategoryName });
          }
        }

        const blogPost = await createBlogPost({
          tenantId,
          slug,
          title,
          description,
          date: new Date(date),
          image: await storeSupabaseFile({ bucket: "blog", content: image, id: slug }),
          content,
          readingTime,
          published,
          authorId: userInfo.userId,
          categoryId: categoryId.length ? categoryId : category?.id ?? null,
          tagNames: tags.split(",").filter((f) => f.trim() != ""),
          contentType,
        });

        if (blogPost) {
          return redirect(UrlUtils.getBlogPath(params, blogPost.slug));
        } else {
          return json({ error: "Could not create post" }, { status: 400 });
        }
      } catch (e: any) {
        return json({ error: e.message }, { status: 400 });
      }
    } else {
      return json({ error: t("shared.invalidForm") }, { status: 400 });
    }
  };
}
