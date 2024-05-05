import { Fragment, useEffect, useState } from "react";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import { TenantSubscriptionWithDetails } from "~/utils/db/tenantSubscriptions.db.server";
import Plans from "../Plans";

interface Props {
  items: SubscriptionProductDto[];
  tenantSubscription?: TenantSubscriptionWithDetails | null;
  canSubmit?: boolean;
}
export default function PlansGrouped({ items, tenantSubscription, canSubmit }: Props) {
  const [groups, setGroups] = useState<{ group: { title: string; description: string }; items: SubscriptionProductDto[] }[]>([]);

  useEffect(() => {
    const groups: { group: { title: string; description: string }; items: SubscriptionProductDto[] }[] = [];
    items.forEach((product) => {
      let found = groups.find((f) => f.group.title === product.groupTitle && f.group.description === product.groupDescription);
      if (!found) {
        found = groups.find((f) => !f.group.title && !f.group.description && !product.groupTitle && !product.groupDescription);
      }
      if (found) {
        found.items.push(product);
      } else {
        groups.push({
          group: {
            title: product.groupTitle ?? "",
            description: product.groupDescription ?? "",
          },
          items: [product],
        });
      }
    });
    setGroups(groups);
  }, [items]);

  return (
    <Fragment>
      <div className="space-y-10">
        {groups.map((group, idx) => {
          return (
            <Fragment key={idx}>
              <div>
                {group.group.title && (
                  <div className="py-4">
                    <div className="py-2">
                      <h2 className="text-2xl font-bold text-gray-700 dark:text-white md:text-3xl">{group.group.title}</h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400">{group.group.description}</p>
                    </div>
                  </div>
                )}
                <Plans key={idx} items={group.items} tenantSubscription={tenantSubscription} canSubmit={canSubmit} className="space-y-4" />
              </div>
            </Fragment>
          );
        })}
      </div>
    </Fragment>
  );
}
