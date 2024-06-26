import { useTranslation } from "react-i18next";
import { json, LoaderArgs, V2_MetaFunction, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import RowHelper from "~/utils/helpers/RowHelper";
import { createUserSession, getUserInfo } from "~/utils/session.server";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import RowOverviewRoute from "~/modules/rows/components/RowOverviewRoute";
import { RowsApi } from "~/utils/api/RowsApi";
import { Language } from "remix-i18next";
import { EntityWithDetails, getAllEntities, getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { baseURL } from "~/utils/url.server";
import ServerError from "~/components/ui/errors/ServerError";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  i18n: Record<string, Language>;
  title: string;
  error?: string;
  publicRowData?: {
    rowData: RowsApi.GetRowData;
    routes: EntitiesApi.Routes;
    relationshipRows: RowsApi.GetRelationshipRowsData;
  };
};
export let loader = async ({ request, params }: LoaderArgs) => {
  let { t, translations } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  if (userInfo.lightOrDarkMode === "dark") {
    return createUserSession(
      {
        ...userInfo,
        lightOrDarkMode: "light",
      },
      new URL(request.url).pathname
    );
  }

  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity!, activeOnly: true });
  const userId = (await getUserInfo(request)).userId;
  if (!entity.isAutogenerated || entity.type === "system") {
    return redirect("/404?entity=" + params.entity);
  }
  try {
    const rowData = await RowsApi.get(params.id!, {
      entity,
      userId,
    });
    if (!rowData.rowPermissions.canRead) {
      throw Error(t(entity.title) + " is not public");
    }
    const data: LoaderData = {
      i18n: translations,
      title: `${RowHelper.getTextDescription({ entity, item: rowData.item, t })} | ${process.env.APP_NAME}`,
      publicRowData: {
        rowData,
        routes: {
          publicUrl: baseURL + `/public/:entity/:id`,
        },
        relationshipRows: await RowsApi.getRelationshipRows({ entity, tenantId: rowData.item.tenantId, userId }),
      },
    };
    return json({ ...data, i18n: translations });
  } catch (e: any) {
    return json({ i18n: translations, error: e.message }, { status: 500 });
  }
};

export const meta: V2_MetaFunction = ({ data }) => {
  return [{ title: data.title }];
};

export default function PublicRowItemRoute() {
  const { publicRowData, error } = useTypedLoaderData<LoaderData>();
  const { t } = useTranslation();
  return (
    <>
      <div>
        <div>
          <HeaderBlock />
          <div className="bg-white dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="sm:align-center sm:flex sm:flex-col">
                <div className="relative mx-auto w-full max-w-7xl overflow-hidden px-2 py-12 sm:py-6">
                  <svg className="absolute left-full translate-x-1/2 transform" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
                    <defs>
                      <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
                      </pattern>
                    </defs>
                    <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-full -translate-x-1/2 transform"
                    width="404"
                    height="404"
                    fill="none"
                    viewBox="0 0 404 404"
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
                      </pattern>
                    </defs>
                    <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
                  </svg>

                  {!publicRowData ? (
                    <>
                      <div className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("shared.unauthorized")}</h1>
                        <p className="mt-4 text-lg leading-6 text-gray-500">{error}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">
                          {t(publicRowData.rowData.entity.title)}
                        </h1>
                        <p className="mt-4 text-lg leading-6 text-gray-500">
                          {publicRowData.rowData.item?.tenant ? (
                            <div>
                              {publicRowData.rowData.item?.tenant?.name}, {RowHelper.getRowFolio(publicRowData.rowData.entity, publicRowData.rowData.item)}
                            </div>
                          ) : (
                            <div>{RowHelper.getRowFolio(publicRowData.rowData.entity, publicRowData.rowData.item)}</div>
                          )}
                        </p>
                      </div>
                      <div className="mt-12">
                        <div className="space-y-3 border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                          <RowOverviewRoute
                            rowData={publicRowData.rowData}
                            item={publicRowData.rowData.item}
                            routes={publicRowData.routes}
                            relationshipRows={publicRowData.relationshipRows}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
