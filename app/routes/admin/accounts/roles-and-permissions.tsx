import { useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "~/utils/app/UrlUtils";
import { useEffect } from "react";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";

type LoaderData = {
  title: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  await verifyUserHasPermission(request, "admin.roles.view");
  if (UrlUtils.stripTrailingSlash(new URL(request.url).pathname) === "/admin/accounts/roles-and-permissions") {
    return redirect("/admin/accounts/roles-and-permissions/roles");
  }

  let { t } = await i18nHelper(request);

  const data: LoaderData = {
    title: `${t("models.role.plural")} | ${process.env.APP_NAME}`,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminRolesRoute() {
  const { t } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (UrlUtils.stripTrailingSlash(location.pathname) === "/admin/accounts/roles-and-permissions") {
      navigate("/admin/accounts/roles-and-permissions/roles");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <EditPageLayout
      title={t("app.sidebar.rolesAndPermissions")}
      tabs={[
        {
          name: t("models.role.plural"),
          routePath: "/admin/accounts/roles-and-permissions/roles",
        },
        {
          name: t("models.permission.plural"),
          routePath: "/admin/accounts/roles-and-permissions/permissions",
        },
        {
          name: t("models.role.adminRoles"),
          routePath: "/admin/accounts/roles-and-permissions/admin-users",
        },
        {
          name: t("models.role.userRoles"),
          routePath: "/admin/accounts/roles-and-permissions/account-users",
        },
        {
          name: "Seed",
          routePath: "/admin/accounts/roles-and-permissions/seed",
        },
      ]}
    >
      <Outlet />
    </EditPageLayout>
  );
}
