import { useEffect } from "react";
import { json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import UrlUtils from "~/utils/app/UrlUtils";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { i18nHelper } from "~/locale/i18n.utils";

export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.analytics.view");
  if (UrlUtils.stripTrailingSlash(new URL(request.url).pathname) === "/admin/analytics") {
    return redirect("/admin/analytics/overview");
  }

  return json({
    title: `${t("analytics.title")} | ${process.env.APP_NAME}`,
  });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminAnalticsRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (UrlUtils.stripTrailingSlash(location.pathname) === "/admin/analytics") {
      navigate("/admin/analytics/overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return <Outlet />;
}
