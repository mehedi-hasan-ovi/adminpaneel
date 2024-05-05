import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";
import clsx from "~/utils/shared/ClassesUtils";
import { useState } from "react";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import Plan from "./Plan";
import ToggleBillingPeriod from "./ToggleBillingPeriod";
import CurrencyToggle from "~/components/ui/toggles/CurrencyToggle";
import currencies from "~/application/pricing/currencies";
import { PricingModel } from "~/application/enums/subscriptions/PricingModel";
import { getYearlyDiscount } from "~/utils/helpers/PricingHelper";
import { TenantSubscriptionWithDetails } from "~/utils/db/tenantSubscriptions.db.server";
import { SubscriptionPriceDto } from "~/application/dtos/subscriptions/SubscriptionPriceDto";
import { useRootData } from "~/utils/data/useRootData";

interface Props {
  items: SubscriptionProductDto[];
  tenantSubscription?: TenantSubscriptionWithDetails | null;
  canSubmit?: boolean;
  className?: string;
}
export default function Plans({ items, tenantSubscription, canSubmit, className }: Props) {
  const { appConfiguration } = useRootData();
  const [products] = useState(items);
  const [currency, setCurrency] = useState(currencies.find((f) => f.default)?.value ?? "");

  const [billingPeriod, setBillingPeriod] = useState<SubscriptionBillingPeriod>(appConfiguration.subscription.defaultBillingPeriod);

  function toggleBillingPeriod() {
    if (billingPeriod === SubscriptionBillingPeriod.MONTHLY) {
      setBillingPeriod(SubscriptionBillingPeriod.YEARLY);
    } else {
      setBillingPeriod(SubscriptionBillingPeriod.MONTHLY);
    }
  }

  function getRecurringPrices() {
    let prices: SubscriptionPriceDto[] = [];
    products
      .filter((f) => f.model !== PricingModel.ONCE)
      .forEach((product) => {
        const recurringPrices = product.prices;
        prices = prices.concat(recurringPrices);
      });
    return prices;
  }

  function alreadyOwned(plan: SubscriptionProductDto) {
    const found = tenantSubscription?.products.find((f) => f.subscriptionProductId === plan.id);
    if (found) {
      return true;
    }
    return false;
  }

  function checkUpgradeDowngrade(plan: SubscriptionProductDto) {
    const existing = tenantSubscription?.products.find((f) => f)?.subscriptionProduct;
    if (existing) {
      if (plan.order > existing.order) {
        return { upgrade: true };
      } else {
        return { downgrade: true };
      }
    }
  }

  return (
    <div className={clsx(className, items.length === 1 && "mx-auto max-w-2xl")}>
      <div className="flex items-center justify-between">
        <div>{currencies.filter((f) => !f.disabled).length > 1 && <CurrencyToggle value={currency} setValue={setCurrency} />}</div>
        <div>
          {getRecurringPrices().length > 0 && (
            <ToggleBillingPeriod
              size="sm"
              billingPeriod={billingPeriod}
              toggleBillingPeriod={toggleBillingPeriod}
              yearlyDiscount={getYearlyDiscount(getRecurringPrices(), currency)}
            />
          )}
        </div>
      </div>
      <div
        className={clsx(
          "grid gap-6 lg:gap-3",
          items.length === 2 && "lg:grid-cols-2 xl:grid-cols-2",
          items.length === 3 && "lg:grid-cols-3 xl:grid-cols-3",
          items.length === 4 && "lg:grid-cols-4 xl:grid-cols-4",
          items.length === 5 && "lg:grid-cols-5 xl:grid-cols-5",
          items.length === 6 && "lg:grid-cols-3 xl:grid-cols-3",
          items.length === 7 && "lg:grid-cols-3 xl:grid-cols-3",
          items.length >= 8 && "lg:grid-cols-3 xl:grid-cols-3"
        )}
      >
        {products.map((plan, index) => {
          return (
            <Plan
              key={index}
              className={clsx((products.length === 1 || (products.length === 4 && index === 3)) && "lg:col-span-1")}
              product={plan}
              title={plan.title}
              description={plan.description ?? undefined}
              badge={plan.badge ?? undefined}
              features={plan.features}
              billingPeriod={billingPeriod}
              currency={currency}
              prices={plan.prices}
              model={plan.model}
              usageBasedPrices={plan.usageBasedPrices}
              alreadyOwned={alreadyOwned(plan)}
              // tenantSubscription={tenantSubscription}
              canSubmit={canSubmit}
              isUpgrade={checkUpgradeDowngrade(plan)?.upgrade}
              isDowngrade={checkUpgradeDowngrade(plan)?.downgrade}
            />
          );
        })}
      </div>
    </div>
  );
}
