import { LoaderArgs, V2_MetaFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Language } from "remix-i18next";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";
import Logo from "~/components/brand/Logo";
import { i18nHelper } from "~/locale/i18n.utils";
import { TenantWithDetails, getTenant } from "~/utils/db/tenants.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";

type LoaderData = {
  metatags: MetaTagsDto;
  i18n: Record<string, Language>;
  currentTenant: TenantWithDetails;
};
export const meta: V2_MetaFunction = ({ data }) => data?.metatags;
export let loader = async ({ request, params }: LoaderArgs) => {
  const { t, translations } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  const currentTenant = await getTenant(tenantId);
  if (!currentTenant) {
    throw redirect(`/app`);
  }
  if (!currentTenant.deactivatedReason) {
    return redirect(`/app/${currentTenant.slug}/dashboard`);
  }
  const data: LoaderData = {
    metatags: [
      {
        title: `${t("shared.deactivated")} | ${process.env.APP_NAME}`,
      },
    ],
    i18n: translations,
    currentTenant,
  };
  return json(data);
};

export default function TenantDeactivatedRoute() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
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
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">{data.currentTenant.name}</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-5xl">{t("shared.deactivated")}</h1>
                <p className="mt-2 text-lg text-gray-600">{data.currentTenant.deactivatedReason}</p>
                <div className="mt-4 flex">
                  <Link to="." className="w-full text-center text-sm font-medium text-theme-600 hover:text-theme-500 dark:text-theme-400">
                    Reload
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
