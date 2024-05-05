import { useEffect } from "react";
import { json, LoaderArgs, redirect } from "@remix-run/node";
import { Outlet, useLocation, useNavigate, useParams } from "@remix-run/react";
import AppLayout from "~/components/app/AppLayout";
import { loadAppData, useAppData } from "~/utils/data/useAppData";
import { getUser, updateUserDefaultTenantId } from "~/utils/db/users.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import { getTenantUserByIds } from "~/utils/db/tenants.db.server";
import { getAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import UrlUtils from "~/utils/app/UrlUtils";
import { useRootData } from "~/utils/data/useRootData";
import ServerError from "~/components/ui/errors/ServerError";
import { createUniqueTenantIpAddress } from "~/utils/db/tenants/tenantIpAddress.db.server";
import { getClientIPAddress } from "~/utils/server/IpUtils";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export let loader = async ({ request, params }: LoaderArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant");
  const data = await time(loadAppData({ request, params }, time), "loadAppData");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const userInfo = await time(getUserInfo(request), "getUserInfo");
  const user = await time(getUser(userInfo.userId), "getUser");
  if (!user?.admin) {
    const tenantUser = await time(getTenantUserByIds(tenantId, userInfo.userId), "getTenantUserByIds");
    if (!tenantUser) {
      // throw redirect("/app");
    }
  }
  if (user?.defaultTenantId !== tenantId) {
    await time(updateUserDefaultTenantId({ defaultTenantId: tenantId }, userInfo.userId), "updateUserDefaultTenantId");
  }
  // Store IP Address
  await time(
    createUniqueTenantIpAddress({
      ip: getClientIPAddress(request) ?? "Unknown",
      fromUrl: new URL(request.url).pathname,
      tenantId,
      userId: userInfo.userId,
    }),
    "createUniqueTenantIpAddress"
  );

  if (!UrlUtils.stripTrailingSlash(new URL(request.url).pathname).startsWith(`/app/${params.tenant}/settings`)) {
    const appConfiguration = await time(getAppConfiguration(), "getAppConfiguration");
    if (appConfiguration.subscription.required && data.mySubscription?.products.length === 0) {
      throw redirect(`/subscribe/${params.tenant}?error=subscription_required`);
    }
  }
  if (data.currentTenant.deactivatedReason) {
    throw redirect(`/deactivated/${params.tenant}`);
  }
  return json(data, { headers: getServerTimingHeader() });
};

export default function AppTenantRoute() {
  const appData = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { appConfiguration } = useRootData();
  // const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!appData.currentTenant) {
      navigate("/app");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData.currentTenant]);

  useEffect(() => {
    if (!UrlUtils.stripTrailingSlash(location.pathname).startsWith(`/app/${params.tenant}/settings`)) {
      if (appConfiguration.subscription.required && appData.mySubscription?.products.length === 0) {
        navigate(`/subscribe/${params.tenant}?error=subscription_required`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      <AppLayout layout="app">
        <Outlet />
      </AppLayout>
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
