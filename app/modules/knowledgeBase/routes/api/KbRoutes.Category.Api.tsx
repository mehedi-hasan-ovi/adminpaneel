import { LoaderArgs, json } from "@remix-run/node";
import { redirect } from "remix-typedjson";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { KbCategoryDto } from "../../dtos/KbCategoryDto";
import { KnowledgeBaseDto } from "../../dtos/KnowledgeBaseDto";
import KnowledgeBaseService from "../../service/KnowledgeBaseService.server";
import KnowledgeBaseUtils from "../../utils/KnowledgeBaseUtils";
import { KbSearchResultDto } from "../../dtos/KbSearchResultDto";

export namespace KbRoutesCategoryApi {
  export type LoaderData = {
    i18n: Record<string, any>;
    metatags?: MetaTagsDto;
    kb: KnowledgeBaseDto;
    search: KbSearchResultDto | undefined;
    item: KbCategoryDto | null;
    language: string;
    allCategories: KbCategoryDto[];
  };
  export let loader = async ({ request, params }: LoaderArgs, { kbSlug }: { kbSlug?: string } = {}) => {
    const { translations } = await i18nHelper(request);
    const kb = await KnowledgeBaseService.get({ slug: kbSlug ?? params.slug!, enabled: true });
    const language = params.lang ?? kb.defaultLanguage;

    const item = await KnowledgeBaseService.getCategory({
      kb,
      category: params.category ?? "",
      language,
      params,
    });
    if (!item) {
      return redirect(KnowledgeBaseUtils.getKbUrl({ kb, params }));
    }
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q")?.toString();
    const data: LoaderData = {
      i18n: translations,
      metatags: item?.metatags,
      kb,
      search: await KnowledgeBaseService.search({ query, kb, params }),
      item,
      allCategories: await KnowledgeBaseService.getCategories({
        kb,
        params,
      }),
      language,
    };
    return json(data);
  };
}
