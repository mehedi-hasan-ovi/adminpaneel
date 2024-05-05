import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { DashboardStats } from "~/components/ui/stats/DashboardStats";
import { getAdminDashboardStats } from "~/utils/services/adminDashboardService";
import { getSetupSteps } from "~/utils/services/setupService";
import SetupSteps from "~/components/admin/SetupSteps";
import ProfileBanner from "~/components/app/ProfileBanner";
import { adminGetAllTenantsWithUsage, TenantWithUsage } from "~/utils/db/tenants.db.server";
import TenantsTable from "~/components/core/tenants/TenantsTable";
import { SetupItem } from "~/application/dtos/setup/SetupItem";
import { Stat } from "~/application/dtos/stats/Stat";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import InputSelector from "~/components/ui/input/InputSelector";
import { useTranslation } from "react-i18next";
import PeriodHelper, { defaultPeriodFilter, PeriodFilters } from "~/utils/helpers/PeriodHelper";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { promiseHash } from "~/utils/promises/promiseHash";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
export { serverTimingHeaders as headers };

type LoaderData = {
  title: string;
  stats: Stat[];
  setupSteps: SetupItem[];
  tenants: TenantWithUsage[];
  tenantsPagination: PaginationDto;
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "admin.dashboard");
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);

  const { t } = await time(i18nHelper(request), "i18nHelper");
  const { stats, setupSteps, tenants } = await time(
    promiseHash({
      stats: time(
        getAdminDashboardStats({ gte: PeriodHelper.getGreaterThanOrEqualsFromRequest({ request }) }),
        "admin.dashboard.details.getAdminDashboardStats"
      ),
      setupSteps: time(getSetupSteps(), "admin.dashboard.details.getSetupSteps"),
      tenants: time(adminGetAllTenantsWithUsage(undefined, currentPagination), "admin.dashboard.details.adminGetAllTenantsWithUsage"),
    }),
    "admin.dashboard.details"
  );

  const data: LoaderData = {
    title: `${t("app.sidebar.dashboard")} | ${process.env.APP_NAME}`,
    stats,
    // entitiesStats,
    setupSteps,
    tenants: tenants.items,
    tenantsPagination: tenants.pagination,
  };
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function AdminNavigationRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const appOrAdminData = useAppOrAdminData();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <main className="relative z-0 flex-1 overflow-y-auto pb-8">
      {/*Page header */}
      <div className="hidden bg-white shadow md:block lg:border-t lg:border-gray-200">
        <ProfileBanner user={appOrAdminData.user} />
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-5 sm:px-8">
        {getUserHasPermission(appOrAdminData, "admin.dashboard.view") ? (
          <div className="space-y-5 overflow-hidden">
            <div className="overflow-x-auto">
              {data.setupSteps.filter((f) => f.completed).length < data.setupSteps.length && <SetupSteps items={data.setupSteps} />}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between space-x-2">
                <h3 className="flex-grow font-medium leading-4 text-gray-900">{t("app.dashboard.summary")}</h3>
                <div>
                  <InputSelector
                    className="w-44"
                    withSearch={false}
                    name="period"
                    value={searchParams.get("period")?.toString() ?? defaultPeriodFilter}
                    options={PeriodFilters.map((f) => {
                      return {
                        value: f.value,
                        name: t(f.name),
                      };
                    })}
                    setValue={(value) => {
                      if (value) {
                        searchParams.set("period", value?.toString() ?? "");
                      } else {
                        searchParams.delete("period");
                      }
                      setSearchParams(searchParams);
                    }}
                  />
                </div>
              </div>
              <DashboardStats items={data.stats} />
            </div>

            <div className="space-y-4 overflow-x-auto">
              <h3 className="font-medium leading-4 text-gray-900">Tenants</h3>
              <TenantsTable items={data.tenants} pagination={data.tenantsPagination} />
            </div>
          </div>
        ) : (
          <div className="font-medium">You don't have permission to view the dashboard.</div>
        )}
      </div>
    </main>
  );
}
