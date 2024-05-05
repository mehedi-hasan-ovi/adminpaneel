import { useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import Logo from "~/components/brand/Logo";
import { i18nHelper } from "~/locale/i18n.utils";

export let loader: LoaderFunction = async ({ request }) => {
  let { t, translations } = await i18nHelper(request);
  return json({
    title: `${t("shared.unauthorized")} | ${process.env.APP_NAME}`,
    i18n: translations,
  });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function Page401() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <>
      <div className="">
        <div className="flex min-h-full flex-col pb-12 pt-16">
          <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="flex flex-shrink-0 justify-center">
              <Logo />
            </div>
            <div className="py-16">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-theme-600">{t("shared.unauthorized")}</p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">You're not authorized to see this page.</h1>
                <p className="mt-2 text-base text-gray-500">Contact your admin and verify your permissions.</p>
                <div className="mt-4 flex">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full text-center text-sm font-medium text-theme-600 hover:text-theme-500 dark:text-theme-400"
                  >
                    <span aria-hidden="true"> &larr;</span> Go back
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <FooterBlock />
    </>
  );
}
