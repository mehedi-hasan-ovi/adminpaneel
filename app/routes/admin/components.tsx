import { useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import AllComponentsList from "~/components/ui/AllComponentsList";
import { i18nHelper } from "~/locale/i18n.utils";

export let loader: LoaderFunction = async ({ request }) => {
  let { t } = await i18nHelper(request);
  return json({
    title: `${t("admin.components.title")} | ${process.env.APP_NAME}`,
  });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminComponentsRoute() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="w-full border-b border-gray-300 bg-white py-2 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between space-x-2 px-4 sm:px-6 lg:px-8 xl:max-w-7xl 2xl:max-w-screen-2xl">
          <h1 className="flex flex-1 items-center truncate font-bold">{t("admin.components.title")}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-2 px-4 pt-2 sm:px-6 lg:px-8 xl:max-w-7xl 2xl:max-w-screen-2xl">
        <AllComponentsList withSlideOvers={true} />
      </div>
    </div>
  );
}
