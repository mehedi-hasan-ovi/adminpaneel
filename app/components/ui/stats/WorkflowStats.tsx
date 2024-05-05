import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Link, useNavigation } from "@remix-run/react";
import { Stat } from "~/application/dtos/stats/Stat";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import { Entity } from "@prisma/client";

interface Props {
  entity: Entity;
  items: Stat[];
}

export function WorkflowStats({ entity, items }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const loading = navigation.state === "loading";
  return (
    <div className="space-y-3">
      <h3 className=" font-medium leading-4 text-gray-900">{t(entity.titlePlural)}</h3>
      <dl
        className={clsx(
          "grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:divide-y-0 md:divide-x",
          items.length === 1 && "md:grid-cols-1",
          items.length === 2 && "md:grid-cols-2",
          items.length === 3 && "md:grid-cols-3",
          items.length === 4 && "md:grid-cols-4",
          items.length === 5 && "md:grid-cols-5",
          items.length === 6 && "md:grid-cols-6"
        )}
      >
        {items.map((item) => (
          <Link to={item.path ?? ""} key={item.name} className="px-4 py-5 hover:bg-gray-50 sm:p-6">
            <dt className="flex items-baseline space-x-1 text-base font-normal text-gray-900">
              <div>{item.workflowState && <WorkflowStateBadge state={item.workflowState} />}</div>
              {item.hint && <div className="hidden text-xs text-gray-400 xl:block">({t(item.hint)})</div>}
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-gray-800">
                <div>{loading ? "..." : item.stat}</div>
                <span className="ml-2 hidden text-sm font-medium text-gray-500 xl:block">
                  {!loading && item.previousStat && (
                    <span>
                      {t("shared.from").toLowerCase()} {item.previousStat}
                    </span>
                  )}
                </span>
              </div>
            </dd>
          </Link>
        ))}
      </dl>
    </div>
  );
}
