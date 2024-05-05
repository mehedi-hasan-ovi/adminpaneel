import { LoaderArgs, V2_MetaFunction, json } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { Language } from "remix-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import ServerError from "~/components/ui/errors/ServerError";
import { i18nHelper } from "~/locale/i18n.utils";
import { BlogPostWithDetails, getAllBlogPosts } from "~/modules/blog/db/blog.db.server";
import BlogPostsBlock from "~/modules/pageBlocks/components/blocks/marketing/blog/posts/BlogPostsBlock";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import HeadingBlock from "~/modules/pageBlocks/components/blocks/marketing/heading/HeadingBlock";
import { TenantSimple, getTenantSimple } from "~/utils/db/tenants.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
type LoaderData = {
  metatags: MetaTagsDto;
  i18n: Record<string, Language>;
  tenant: TenantSimple | null;
  items: BlogPostWithDetails[];
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const { translations } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  const tenant = await getTenantSimple(tenantId);
  if (!tenant) {
    return json({ error: "Not found" }, { status: 404 });
  }
  const data: LoaderData = {
    metatags: [{ title: `${tenant.name} | Blog | ${process.env.APP_NAME}` }],
    i18n: translations,
    tenant: tenantId ? await getTenantSimple(tenantId) : null,
    items: await getAllBlogPosts({ tenantId, published: true }),
  };
  return json(data);
};

export default function () {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  return (
    <div>
      <HeaderBlock />
      <div className="py-4">
        <HeadingBlock
          item={{
            style: "centered",
            headline: !data.tenant ? t("blog.title") : `${data.tenant?.name} ${t("blog.title")}`,
            subheadline: !data.tenant ? t("blog.headline") : "",
          }}
        />
      </div>
      <BlogPostsBlock
        item={{
          style: "simple",
          withCoverImage: true,
          withAuthorName: true,
          withAuthorAvatar: true,
          withDate: true,
          blogPath: data.tenant ? `/b/${data.tenant.slug}` : "/blog",
          data: data.items,
        }}
      />
      <FooterBlock />
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
