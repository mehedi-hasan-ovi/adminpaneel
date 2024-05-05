import { Combobox } from "@headlessui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import Logo from "~/components/brand/Logo";
import EmptyState from "~/components/ui/emptyState/EmptyState";
import { i18nHelper } from "~/locale/i18n.utils";
import UserUtils from "~/utils/app/UserUtils";
import { getMyTenants, TenantSimple } from "~/utils/db/tenants.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { Language } from "remix-i18next";
import { useEffect } from "react";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  myTenants: TenantSimple[];
  i18n: Record<string, Language>;
};

export let loader: LoaderFunction = async ({ request }) => {
  let { translations } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const user = await getUser(userInfo.userId);
  if (!user) {
    throw redirect(`/login`);
  }
  const myTenants = await getMyTenants(userInfo.userId);
  if (myTenants.length === 1) {
    try {
      return redirect("/app/" + encodeURIComponent(myTenants[0].slug) + "/dashboard");
    } catch (e) {
      return redirect("/app/" + myTenants[0].id + "/dashboard");
    }
  }
  if (myTenants.length === 0 && user.admin) {
    return redirect("/admin");
  }

  const data: LoaderData = {
    i18n: translations,
    myTenants,
  };
  return json(data);
};

export default function AppRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();

  useEffect(() => {
    try {
      // @ts-ignore
      $crisp.push(["do", "chat:hide"]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div>
      <div className="bg-white pt-20 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div className="flex flex-shrink-0 justify-center">
            <Logo />
          </div>
          <div className="sm:align-center sm:flex sm:flex-col">
            <div className="relative mx-auto w-full max-w-xl overflow-hidden px-2 py-12 sm:py-6">
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
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("app.tenants.select")}</h1>
                <p className="mt-4 text-lg leading-6 text-gray-500">
                  {data.myTenants.length === 1 ? (
                    <span>{t("app.tenants.youBelongToOne")}</span>
                  ) : (
                    <span>{t("app.tenants.youBelongToMany", [data.myTenants.length])}</span>
                  )}
                </p>
              </div>
              <div className="mt-12">
                {data.myTenants.length === 0 ? (
                  <EmptyState
                    className="rounded-2xl bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    captions={{
                      thereAreNo: t("api.errors.noOrganizations"),
                    }}
                  />
                ) : (
                  <Combobox
                    as="div"
                    className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 shadow-sm ring-1 ring-black ring-opacity-5 transition-all dark:border-gray-800"
                    onChange={() => {}}
                    value={""}
                  >
                    <Combobox.Options static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                      {data.myTenants.map((item) => (
                        <Combobox.Option key={item.id} value={item}>
                          {({ active }) => (
                            <>
                              <Link
                                to={`/app/${item.slug}/dashboard`}
                                className={clsx("flex cursor-pointer select-none rounded-xl p-3", active && "bg-gray-100 dark:bg-gray-800")}
                              >
                                {item.icon ? (
                                  <img src={item.icon} className="h-10 w-10 rounded-lg" alt={item.name} />
                                ) : (
                                  <div className={clsx("flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-theme-600")}>
                                    <span className="inline-flex h-9 w-9 items-center justify-center">
                                      <span className="text-sm font-medium leading-none text-theme-200">{UserUtils.getTenantPrefix(item)}</span>
                                    </span>
                                  </div>
                                )}
                                <div className="ml-4 flex-auto">
                                  <p className={clsx("text-sm font-medium", active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-100")}>
                                    {item.name}
                                  </p>
                                  <p className={clsx("text-sm", active ? "text-gray-700 dark:text-gray-400" : "text-gray-500")}>{item.name}</p>
                                </div>
                              </Link>
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Combobox>
                )}
                <div className="mt-4 flex pb-12">
                  <Link to="/new-account" className="w-full text-center text-sm font-medium text-theme-600 hover:text-theme-500 dark:text-theme-400">
                    Create an organization<span aria-hidden="true"> &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
