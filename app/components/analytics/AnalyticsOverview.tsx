import { Link } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import UrlUtils from "~/utils/app/UrlUtils";
import { useRootData } from "~/utils/data/useRootData";
import { AnalyticsOverviewDto } from "~/utils/services/analyticsService";
import NumberUtils from "~/utils/shared/NumberUtils";
import ColorBadge from "../ui/badges/ColorBadge";

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="overflow-hidden rounded-lg bg-white px-4 py-3 shadow hover:bg-gray-50">
    <dt className="truncate text-xs font-medium uppercase text-gray-500">{label}</dt>
    <dd className="mt-1 truncate text-2xl font-semibold text-gray-900">{NumberUtils.intFormat(value)}</dd>
  </div>
);

const Metrics = ({ authenticated, overview }: { authenticated: Boolean; overview: AnalyticsOverviewDto }) => {
  const { t } = useTranslation();
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {authenticated ? (
        <>
          <Link to="/admin/analytics/visitors">
            <Metric label={t("analytics.uniqueVisitors")} value={overview.uniqueVisitors} />
          </Link>
          <Link to="/admin/analytics/page-views">
            <Metric label={t("analytics.pageViews")} value={overview.pageViews} />
          </Link>
          <Link to="/admin/analytics/events">
            <Metric label={t("analytics.events")} value={overview.events} />
          </Link>
        </>
      ) : (
        <>
          <Metric label={t("analytics.uniqueVisitors")} value={overview.uniqueVisitors} />
          <Metric label={t("analytics.pageViews")} value={overview.pageViews} />
          <Metric label={t("analytics.events")} value={overview.events} />
        </>
      )}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <dt className="flex items-center space-x-2 truncate text-xs font-medium uppercase text-gray-500">
          <ColorBadge color={overview.liveVisitors === 0 ? Colors.GRAY : Colors.GREEN} />
          <div>{t("analytics.liveVisitors")}</div>
        </dt>
        <dd className="mt-1 truncate text-2xl font-semibold text-gray-900">{NumberUtils.intFormat(overview.liveVisitors)} </dd>
      </div>
    </dl>
  );
};

interface TopItemDto {
  title: string;
  items: { name: string | null; count: number }[];
  viewMoreRoute?: string;
  fallbackName?: string;
  bgClassName?: string;
  tabTitle?: string;
}

function TopItemsData({ title, items, viewMoreRoute, fallbackName, bgClassName }: TopItemDto) {
  const { authenticated } = useRootData();

  function getWidthPercentageCss(current: { count: number }) {
    const counts = items.map((item) => {
      return item.count;
    });
    const max = Math.max(...counts);

    const percentage = (current.count / max) * 100;
    if (percentage >= 95) {
      return "w-[95%]";
    } else if (percentage >= 90) {
      return "w-[90%]";
    } else if (percentage >= 80) {
      return "w-[80%]";
    } else if (percentage >= 70) {
      return "w-[70%]";
    } else if (percentage >= 60) {
      return "w-[60%]";
    } else if (percentage >= 50) {
      return "w-[50%]";
    } else if (percentage >= 40) {
      return "w-[40%]";
    } else if (percentage >= 30) {
      return "w-[30%]";
    } else if (percentage >= 20) {
      return "w-[20%]";
    } else if (percentage >= 10) {
      return "w-[10%]";
    } else if (percentage >= 3) {
      return "w-[3%]";
    }
    return "w-[3%]";
  }

  const renderTopItems = () => {
    return items.map((item, idx) => (
      <div key={idx} className="flex justify-between space-x-2">
        <div className="w-full truncate">
          <div className={clsx("overflow-visible px-2 py-0.5 text-sm", getWidthPercentageCss(item), bgClassName ?? "bg-orange-50")}>
            {fallbackName ? <span>{!item.name ? fallbackName : item.name}</span> : <div>{item.name}</div>}
          </div>
        </div>
        <div className=" w-10 px-2 py-0.5 text-right text-sm font-extrabold">{NumberUtils.intFormat(item.count)}</div>
      </div>
    ));
  };

  return (
    <>
      <div className="h-48 space-y-1 overflow-y-auto">{renderTopItems()}</div>
      {viewMoreRoute && authenticated && (
        <Link to={viewMoreRoute} className="flex justify-center p-1 text-xs font-medium text-gray-600 underline hover:text-gray-700">
          View more
        </Link>
      )}
    </>
  );
}

function TopItems({ tabs }: { tabs: TopItemDto[] }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tab, setTab] = useState(tabs[0]);

  useEffect(() => {
    setTab(tabs[selectedTab]);
  }, [selectedTab, tabs]);

  return (
    <div className="space-y-1 truncate rounded-md border border-gray-100 bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between space-x-2">
        <h4 className="text-sm font-bold">{tab.title}</h4>
        {tabs.length > 1 && (
          <div className="flex items-center space-x-1 truncate">
            {tabs.map((item, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTab(idx)}
                  className={clsx(
                    "truncate text-xs font-medium",
                    selectedTab === idx ? "text-theme-500 underline hover:text-theme-600" : "text-gray-600 hover:text-gray-600"
                  )}
                >
                  {item.tabTitle}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TopItemsData {...tab} />
    </div>
  );
}

export default function AnalyticsOverview({ overview, withUsers }: { overview: AnalyticsOverviewDto; withUsers: boolean }) {
  const { authenticated } = useRootData();
  return (
    <div className="space-y-2 text-gray-800">
      <Metrics authenticated={authenticated} overview={overview} />

      <div className="rounded-md border-2 border-dotted border-gray-300 bg-white">
        <div className="flex justify-center py-24 text-sm font-bold italic text-gray-500">Chart (under construction...)</div>
      </div>

      <div className={clsx("grid gap-2", withUsers && "md:grid-cols-2 lg:grid-cols-4", !withUsers && "md:grid-cols-2 lg:grid-cols-3")}>
        <TopItems
          tabs={[
            {
              title: "Top HTTP referrers",
              items: overview.top.httpReferrers.map((item) => {
                return {
                  name: UrlUtils.stripTrailingSlash(item.name?.replace("https://", "").replace("http://", "").replace("www.", "") ?? ""),
                  count: item.count,
                };
              }),
              fallbackName: "Direct",
              bgClassName: "bg-orange-50",
            },
          ]}
        />
        <TopItems
          tabs={[
            { title: "Top pages", items: overview.top.urls, fallbackName: "?", bgClassName: "bg-emerald-50", tabTitle: "Pages" },
            { title: "Top routes", items: overview.top.routes, fallbackName: "?", bgClassName: "bg-emerald-50", tabTitle: "Routes" },
          ]}
        />
        <TopItems
          tabs={[
            { tabTitle: "Source", title: "Top sources", items: overview.top.sources, fallbackName: "noreferrer", bgClassName: "bg-indigo-50" },
            { tabTitle: "Affiliates", title: "Top affiliates", items: overview.top.via, fallbackName: "?", bgClassName: "bg-teal-50" },
            { tabTitle: "Medium", title: "Medium", items: overview.top.medium, fallbackName: "none", bgClassName: "bg-indigo-50" },
            { tabTitle: "Campaigns", title: "Campaigns", items: overview.top.campaign, fallbackName: "none", bgClassName: "bg-indigo-50" },
          ]}
        />
        {withUsers && <TopItems tabs={[{ tabTitle: "Users", title: "Users", items: overview.top.user, fallbackName: "none", bgClassName: "bg-indigo-50" }]} />}
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        <TopItems tabs={[{ title: "Operating systems", items: overview.top.os, fallbackName: "?", bgClassName: "bg-gray-50" }]} />
        <TopItems tabs={[{ title: "Devices", items: overview.top.devices, fallbackName: "?", bgClassName: "bg-gray-50" }]} />
        <TopItems tabs={[{ title: "Countries", items: overview.top.countries, fallbackName: "?", bgClassName: "bg-gray-50" }]} />
      </div>
    </div>
  );
}
