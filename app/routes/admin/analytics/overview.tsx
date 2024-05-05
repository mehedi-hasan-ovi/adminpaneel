import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import AnalyticsOverview from "~/components/analytics/AnalyticsOverview";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import { AnalyticsOverviewDto, getAnalyticsOverview } from "~/utils/services/analyticsService";

type LoaderData = {
  overview: AnalyticsOverviewDto;
};
export let loader: LoaderFunction = async () => {
  const data: LoaderData = {
    overview: await getAnalyticsOverview({ withUsers: true }),
  };
  return json(data);
};

export default function AdminAnalyticsOverviewRoute() {
  const { t } = useTranslation();
  const { overview } = useLoaderData<LoaderData>();
  return (
    <>
      <IndexPageLayout
        replaceTitleWithTabs={true}
        tabs={[
          {
            name: t("analytics.overview"),
            routePath: "/admin/analytics/overview",
          },
          {
            name: t("analytics.uniqueVisitors"),
            routePath: "/admin/analytics/visitors",
          },
          {
            name: t("analytics.pageViews"),
            routePath: "/admin/analytics/page-views",
          },
          {
            name: t("analytics.events"),
            routePath: "/admin/analytics/events",
          },
          {
            name: t("analytics.settings"),
            routePath: "/admin/analytics/settings",
          },
        ]}
      >
        <AnalyticsOverview overview={overview} withUsers={true} />
      </IndexPageLayout>
    </>
  );
}
