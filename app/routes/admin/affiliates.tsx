import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import UnderConstruction from "~/components/ui/misc/UnderConstruction";
import { i18nHelper } from "~/locale/i18n.utils";

export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  return json({
    title: `${t("affiliates.title")} | ${process.env.APP_NAME}`,
  });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminAffiliatesRoute() {
  return <UnderConstruction enterpriseFeature={true} title="TODO: Affiliates & Referrals (Add affiliate links, Coupon codes, Comissions, Analytics...)" />;
}
