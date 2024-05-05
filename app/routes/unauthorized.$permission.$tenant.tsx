import { TFunction, useTranslation } from "react-i18next";
import { json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { NavigateFunction, Location, useLocation, useNavigate } from "@remix-run/react";
import { Language } from "remix-i18next";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import Logo from "~/components/brand/Logo";
import ButtonTertiary from "~/components/ui/buttons/ButtonTertiary";
import RefreshIcon from "~/components/ui/icons/RefreshIcon";
import { i18nHelper } from "~/locale/i18n.utils";
import { getPermissionName } from "~/utils/db/permissions/permissions.db.server";
import { getUserPermission } from "~/utils/helpers/PermissionsHelper";
import { getUserInfo } from "~/utils/session.server";
import { useTypedLoaderData } from "remix-typedjson";
import { getMyTenants } from "~/utils/db/tenants.db.server";
import { getTenantRelationshipsFromByUserTenants } from "~/utils/db/tenants/tenantRelationships.db.server";

type LoaderData = {
  title: string;
  i18n: Record<string, Language>;
  permission: { name: string; description: string };
};
export let loader: LoaderFunction = async ({ request, params }) => {
  let { t, translations } = await i18nHelper(request);
  const permission = await getPermissionName(params.permission ?? "");
  const searchParams = new URLSearchParams(new URL(request.url).search);
  const redirectTo = searchParams.get("redirect")?.toString();
  if (redirectTo) {
    if (!permission) {
      return redirect(redirectTo);
    }
    const userInfo = await getUserInfo(request);
    const { userPermission } = await getUserPermission({ userId: userInfo.userId, permissionName: permission.name, tenantId: params.tenant });
    if (userPermission) {
      return redirect(redirectTo);
    } else {
      // TODO: IMPROVE
      const myTenants = await getMyTenants(userInfo.userId);
      const childTenants = await getTenantRelationshipsFromByUserTenants(myTenants.map((f) => f.id));
      const currentTenantAsChild = childTenants.find((f) => f.toTenantId === params.tenant);
      const existingPermission = currentTenantAsChild?.tenantTypeRelationship.permissions.find((f) => f.name === params.permission);
      // TODO: END IMPROVE
      if (existingPermission) {
        return redirect(redirectTo);
      }
    }
  } else if (!permission) {
    return redirect("/404?error=permission-not-found");
  }

  const data: LoaderData = {
    title: `${t("shared.unauthorized")} | ${process.env.APP_NAME}`,
    i18n: translations,
    permission,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

function Unauthorized({
  t,
  permission,
  location,
  navigate,
}: {
  t: TFunction;
  permission: { name: string; description: string };
  location: Location;
  navigate: NavigateFunction;
}) {
  return (
    <div className="py-16">
      <div className="text-center">
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("shared.unauthorized")}</h1>
        <p className="mt-2 text-base text-gray-500">Contact your admin and verify your permissions.</p>
        <PermissionInfo permission={permission} />
        <PermissionButtons location={location} navigate={navigate} />
      </div>
    </div>
  );
}

function PermissionInfo({ permission }: { permission: { name: string; description: string } }) {
  return (
    <div className="mx-auto mt-2 w-96 text-left text-base text-gray-500">
      <div className="flex justify-start space-y-2 border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="space-y-2">
          <div className="font-bold">{permission.description}</div>
          <div>
            <span>Permission &rarr;</span> <span className=" font-light italic">{permission.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionButtons({ location, navigate }: { location: Location; navigate: NavigateFunction }) {
  return (
    <div className="mx-auto mt-2 w-96 text-left text-base text-gray-500">
      <div className="flex items-center justify-between space-x-2">
        <div>
          <ButtonTertiary type="button" onClick={() => navigate(-1)}>
            <div> &larr;</div>
            <div>Go back</div>
          </ButtonTertiary>
        </div>

        <div>
          <ButtonTertiary type="button" onClick={() => navigate(location)}>
            <div>Re-check permission</div>
            <RefreshIcon className="h-4 w-4" />
          </ButtonTertiary>
        </div>
      </div>
    </div>
  );
}

export default function Page401() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { permission } = useTypedLoaderData<LoaderData>();
  return (
    <>
      <div className="">
        <div className="flex min-h-full flex-col pb-12 pt-16">
          <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="flex flex-shrink-0 justify-center">
              <Logo />
            </div>
            <Unauthorized t={t} permission={permission} location={location} navigate={navigate} />
          </main>
        </div>
      </div>
      <FooterBlock />
    </>
  );
}
