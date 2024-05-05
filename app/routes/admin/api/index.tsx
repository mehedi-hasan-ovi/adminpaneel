import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { db } from "~/utils/db.server";
import NumberUtils from "~/utils/shared/NumberUtils";

type LoaderData = {
  summary: {
    apiKeysTotal: number;
    activeEntitiesTotal: number;
    apiKeyLogs: {
      status: number | null;
      total: number;
    }[];
  };
};
export let loader = async () => {
  const apiKeyLogs = (
    await db.apiKeyLog.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    })
  ).map((f) => {
    return {
      status: f.status,
      total: f._count._all,
    };
  });
  const data: LoaderData = {
    summary: {
      apiKeysTotal: await db.apiKey.count(),
      activeEntitiesTotal: await db.entity.count({ where: { hasApi: true } }),
      apiKeyLogs,
    },
  };
  return json(data);
};

export default function () {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();
  return (
    <div className="mx-auto mb-12 max-w-5xl space-y-5 px-4 py-4 sm:px-6 lg:px-8 xl:max-w-7xl">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{t("shared.overview")}</h3>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-3 shadow ">
          <dt className="truncate text-xs font-medium uppercase text-gray-500">
            <div>API Keys</div>
          </dt>
          <dd className="mt-1 truncate text-2xl font-semibold text-gray-900">{NumberUtils.intFormat(data.summary.apiKeysTotal)}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-3 shadow ">
          <dt className="truncate text-xs font-medium uppercase text-gray-500">
            <div>Active Entities</div>
          </dt>
          <dd className="mt-1 truncate text-2xl font-semibold text-gray-900">{NumberUtils.intFormat(data.summary.activeEntitiesTotal)}</dd>
        </div>
        {data.summary.apiKeyLogs.map((f) => {
          return (
            <div key={f.status} className="overflow-hidden rounded-lg bg-white px-4 py-3 shadow ">
              <dt className="truncate text-xs font-medium uppercase text-gray-500">
                <div>{f.status ?? "Unknown"}</div>
              </dt>
              <dd className="mt-1 truncate text-2xl font-semibold text-gray-900">{NumberUtils.intFormat(f.total)}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
