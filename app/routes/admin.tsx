import { useEffect } from "react";
import { json, LoaderFunction } from "@remix-run/node";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import AppLayout from "~/components/app/AppLayout";
import UrlUtils from "~/utils/app/UrlUtils";
import { loadAdminData } from "~/utils/data/useAdminData";
import ServerError from "~/components/ui/errors/ServerError";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "admin");
  const data = await loadAdminData({ request }, time);
  return json(data, { headers: getServerTimingHeader() });
};

export default function AdminRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // @ts-ignore
      $crisp.push(["do", "chat:hide"]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (UrlUtils.stripTrailingSlash(location.pathname) === "/admin") {
      navigate("/admin/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return (
    <AppLayout layout="admin">
      <Outlet />
    </AppLayout>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
