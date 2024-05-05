import { LoaderArgs, V2_MetaFunction, json } from "@remix-run/node";
import { Link, useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Language } from "remix-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import Page404 from "~/components/pages/Page404";
import ServerError from "~/components/ui/errors/ServerError";
import { i18nHelper } from "~/locale/i18n.utils";
import { BlogPostWithDetails, getBlogPost } from "~/modules/blog/db/blog.db.server";
import BlogPostBlock from "~/modules/pageBlocks/components/blocks/marketing/blog/post/BlogPostBlock";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import UrlUtils from "~/utils/app/UrlUtils";
import { getUser } from "~/utils/db/users.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import { baseURL } from "~/utils/url.server";

export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
type LoaderData = {
  metatags: MetaTagsDto;
  i18n: Record<string, Language>;
  post: BlogPostWithDetails | null;
  canEdit: boolean;
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const { t, translations } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  const userInfo = await getUserInfo(request);
  const user = await getUser(userInfo.userId);
  const post = await getBlogPost({ tenantId, idOrSlug: params.postSlug! });
  if (!post) {
    return json({ i18n: translations, error: t("shared.notFound") }, { status: 404 });
  }
  if (!post.published && (!user || !user.admin)) {
    return json({ i18n: translations, error: t("shared.notFound") }, { status: 404 });
  }
  let metatags: MetaTagsDto = [
    { title: post.title },
    { name: "description", content: post.description },
    { name: "keywords", content: post.tags.map((postTag) => postTag.tag.name).join(",") },
    { name: "og:image", content: post.image },
    { name: "og:title", content: post.title },
    { name: "og:description", content: post.description },
    { name: "og:url", content: !tenantId ? `${baseURL}/blog/${post.slug}` : `${baseURL}/b/${params.tenant}/${post.slug}` },
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

  const data: LoaderData = {
    metatags,
    i18n: translations,
    post,
    canEdit: user?.admin !== undefined,
  };

  return json(data);
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();
  const { t } = useTranslation();
  const params = useParams();
  return (
    <div>
      <HeaderBlock />
      {!data.post ? (
        <Page404
          withLogo={false}
          customBackButton={
            <Link to={UrlUtils.getBlogPath(params)}>
              <span aria-hidden="true"> &larr;</span> {t("blog.backToBlog")}
            </Link>
          }
        />
      ) : (
        <BlogPostBlock
          item={{
            style: "simple",
            data: {
              post: data.post,
              canEdit: data.canEdit,
            },
          }}
        />
      )}
      <FooterBlock />
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
