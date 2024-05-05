import { LoaderArgs, json, redirect } from "@remix-run/node";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUserInfo } from "~/utils/session.server";
import { createKnowledgeBaseArticleView, getArticleStateByUserAnalyticsId, voteArticle } from "../../db/kbAnalytics.db.server";
import { KbArticleDto } from "../../dtos/KbArticleDto";
import { KbCategoryDto } from "../../dtos/KbCategoryDto";
import { KnowledgeBaseDto } from "../../dtos/KnowledgeBaseDto";
import KnowledgeBaseService from "../../service/KnowledgeBaseService.server";
import KnowledgeBaseUtils from "../../utils/KnowledgeBaseUtils";
import { KbSearchResultDto } from "../../dtos/KbSearchResultDto";
import { getUser } from "~/utils/db/users.db.server";
import { getAnalyticsInfo } from "~/utils/analyticsCookie.server";

export namespace KbRoutesArticleApi {
  export type LoaderData = {
    i18n: Record<string, any>;
    metatags?: MetaTagsDto;
    kb: KnowledgeBaseDto;
    search: KbSearchResultDto | undefined;
    item: {
      article: KbArticleDto;
      category: KbCategoryDto;
    } | null;
    userState: {
      hasThumbsUp: boolean;
      hasThumbsDown: boolean;
    };
    isAdmin: boolean;
  };
  export let loader = async ({ request, params }: LoaderArgs, { kbSlug }: { kbSlug?: string } = {}) => {
    const { translations } = await i18nHelper(request);
    const analyticsInfo = await getAnalyticsInfo(request);
    const userInfo = await getUserInfo(request);
    const kb = await KnowledgeBaseService.get({ slug: kbSlug ?? params.slug!, enabled: true });
    const item = await KnowledgeBaseService.getArticle({
      kb,
      slug: params.article ?? "",
      params,
    });
    if (!item) {
      return redirect(KnowledgeBaseUtils.getKbUrl({ kb, params }));
    }

    if (item?.article) {
      await createKnowledgeBaseArticleView({ userAnalyticsId: analyticsInfo.userAnalyticsId, articleId: item.article.id });
    }
    let userState = await getArticleStateByUserAnalyticsId({
      userAnalyticsId: analyticsInfo.userAnalyticsId,
      articleId: item?.article.id ?? "",
    });
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q")?.toString();
    const currentUser = await getUser(userInfo.userId);
    const data: LoaderData = {
      i18n: translations,
      metatags: item?.article.metatags,
      kb,
      search: await KnowledgeBaseService.search({ query, kb, params }),
      item,
      userState,
      isAdmin: !!currentUser?.admin,
    };
    return json(data);
  };

  export const action = async ({ request, params }: LoaderArgs, { kbSlug }: { kbSlug?: string } = {}) => {
    const { userAnalyticsId } = await getAnalyticsInfo(request);
    const form = await request.formData();
    const action = form.get("action") as string;
    const kb = await KnowledgeBaseService.get({ slug: kbSlug ?? params.slug!, enabled: true });
    const item = await KnowledgeBaseService.getArticle({
      kb,
      slug: params.article ?? "",
      params,
    });
    if (!item) {
      return json({ error: "Not found" }, { status: 404 });
    }
    if (action === "thumbsUp") {
      await voteArticle({ userAnalyticsId, articleId: item.article.id, type: "up" });
      return json({ success: true });
    } else if (action === "thumbsDown") {
      await voteArticle({ userAnalyticsId, articleId: item.article.id, type: "down" });
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  };
}
