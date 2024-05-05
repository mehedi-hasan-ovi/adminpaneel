import { LoaderArgs, json } from "@remix-run/node";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { BlogPostWithDetails, getAllBlogPosts } from "../../db/blog.db.server";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { AnalyticsPageView } from "@prisma/client";
import { getPageViews } from "~/utils/services/analyticsService";
import UrlUtils from "~/utils/app/UrlUtils";

export namespace BlogRoutesIndexApi {
  export type LoaderData = {
    metatags: MetaTagsDto;
    items: BlogPostWithDetails[];
    views: AnalyticsPageView[];
  };

  export let loader = async ({ request, params }: LoaderArgs) => {
    const tenantId = await getTenantIdOrNull({ request, params });
    if (tenantId === null) {
      await verifyUserHasPermission(request, "admin.blog.view");
    }
    const items = await getAllBlogPosts({ tenantId });
    const data: LoaderData = {
      metatags: [{ title: `Blog | ${process.env.APP_NAME}` }],
      items,
      views: await getPageViews({
        url: { startsWith: UrlUtils.getBlogPath(params) },
      }),
    };
    return json(data);
  };
}
