import { LoaderArgs, json } from "@remix-run/node";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUserInfo } from "~/utils/session.server";
import { createKnowledgeBaseView } from "../../db/kbAnalytics.db.server";
import { KbArticleDto } from "../../dtos/KbArticleDto";
import { KbCategoryDto } from "../../dtos/KbCategoryDto";
import { KnowledgeBaseDto } from "../../dtos/KnowledgeBaseDto";
import KnowledgeBaseService from "../../service/KnowledgeBaseService.server";
import { KbSearchResultDto } from "../../dtos/KbSearchResultDto";
import KnowledgeBaseUtils from "../../utils/KnowledgeBaseUtils";
import RedirectsService from "~/modules/redirects/RedirectsService";
import { getAnalyticsInfo } from "~/utils/analyticsCookie.server";

export namespace KbRoutesIndexApi {
  export type LoaderData = {
    i18n: Record<string, any>;
    metatags: MetaTagsDto;
    kb: KnowledgeBaseDto;
    search: KbSearchResultDto | undefined;
    categories: KbCategoryDto[];
    featured: KbArticleDto[];
  };
  export let loader = async ({ request, params }: LoaderArgs, { kbSlug }: { kbSlug?: string } = {}) => {
    const { translations } = await i18nHelper(request);
    if (params.lang && !KnowledgeBaseUtils.supportedLanguages.find((f) => f.value === params.lang)) {
      await RedirectsService.findAndRedirect({ request });
    }
    const kb = await KnowledgeBaseService.get({ slug: kbSlug ?? params.slug!, enabled: true });

    const { userAnalyticsId } = await getAnalyticsInfo(request);
    // const userInfo = await getUserInfo(request);

    await createKnowledgeBaseView({ userAnalyticsId, knowledgeBaseId: kb.id });
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q")?.toString();
    const data: LoaderData = {
      i18n: translations,
      metatags: kb.metatags,
      kb,
      search: await KnowledgeBaseService.search({ query, kb, params }),
      categories: await KnowledgeBaseService.getCategories({
        kb,
        params,
      }),
      featured: await KnowledgeBaseService.getFeaturedArticles({
        kb,
        params,
      }),
      // searchResult,
    };
    return json(data);
  };
}
