import { LoaderArgs, json } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import ApiSpecsService from "~/modules/api/services/ApiSpecsService";

export const loader = async ({ request }: LoaderArgs) => {
  const { t } = await i18nHelper(request);
  const apiSpecs = await ApiSpecsService.generateSpecs({ t });
  return json(apiSpecs.openApi, { headers: { "Content-Type": "application/json" } });
};
