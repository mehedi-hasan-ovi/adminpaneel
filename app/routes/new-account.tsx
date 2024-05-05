import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { useActionData, useNavigate } from "@remix-run/react";
import { Language } from "remix-i18next";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import TenantNew from "~/components/core/settings/tenant/TenantNew";
import { i18nHelper } from "~/locale/i18n.utils";
import { getAllRoles } from "~/utils/db/permissions/roles.db.server";
import { createTenantUser, getMyTenants, TenantSimple } from "~/utils/db/tenants.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { useTypedLoaderData } from "remix-typedjson";
import { EntityWithDetails, findEntityByName } from "~/utils/db/entities/entities.db.server";
import { TenantsApi } from "~/utils/api/TenantsApi";
import LogoLightMode from "~/components/brand/LogoLightMode";

type LoaderData = {
  myTenants: TenantSimple[];
  i18n: Record<string, Language>;
  tenantSettingsEntity: EntityWithDetails | null;
};

export let loader: LoaderFunction = async ({ request }) => {
  let { translations } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const user = await getUser(userInfo.userId);
  if (!user) {
    throw redirect(`/login`);
  }
  const myTenants = await getMyTenants(userInfo.userId);
  const tenantSettingsEntity = await findEntityByName({ tenantId: null, name: "tenantSettings" });
  const data: LoaderData = {
    i18n: translations,
    myTenants,
    tenantSettingsEntity,
  };
  return json(data);
};

type ActionData = {
  error?: string;
};
export const action: ActionFunction = async ({ request }) => {
  try {
    const form = await request.formData();
    const name = form.get("name")?.toString() ?? "";
    const slug = form.get("slug")?.toString();
    const { tenant, user } = await TenantsApi.create({ request, form, name, slug });
    const roles = await getAllRoles("app");
    await createTenantUser(
      {
        tenantId: tenant.id,
        userId: user.id,
        type: TenantUserType.OWNER,
      },
      roles
    );
    return redirect(`/app/${tenant.slug}/dashboard`);
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};

export default function AppNewAccountRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const navigate = useNavigate();
  const actionData = useActionData<ActionData>();
  return (
    <div className="h-screen bg-white pt-20 text-gray-800">
      <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <div className="flex flex-shrink-0 justify-center">
          <Link to="/" className="inline-flex">
            <LogoLightMode />
          </Link>
        </div>
        <div className="sm:align-center sm:flex sm:flex-col">
          <div className="relative mx-auto w-full max-w-xl overflow-hidden px-2 py-12 sm:py-6">
            <svg className="absolute left-full translate-x-1/2 transform" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
              <defs>
                <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
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
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
            </svg>
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl">{t("app.tenants.create.title")}</h1>
              <p className="mt-4 text-lg leading-6 text-gray-500">{t("app.tenants.create.headline")}</p>
            </div>
            <div className="mt-12">
              <TenantNew tenantSettingsEntity={data.tenantSettingsEntity} />
              <div id="form-error-message">
                {actionData?.error ? (
                  <p className="py-2 text-xs text-rose-500" role="alert">
                    {actionData.error}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex">
                <button type="button" onClick={() => navigate(-1)} className="w-full text-center text-sm font-medium text-theme-600 hover:text-theme-500">
                  <span aria-hidden="true"> &larr;</span> Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
