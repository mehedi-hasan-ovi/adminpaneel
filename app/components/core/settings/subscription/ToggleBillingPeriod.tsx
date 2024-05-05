import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";

interface Props {
  className?: string;
  billingPeriod: SubscriptionBillingPeriod;
  toggleBillingPeriod: () => void;
  yearlyDiscount: string | undefined;
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function ToggleBillingPeriod({ className, billingPeriod, toggleBillingPeriod, yearlyDiscount, size = "md", disabled }: Props) {
  const { t } = useTranslation();
  function setBillingPeriod(item: SubscriptionBillingPeriod) {
    if (billingPeriod !== item) {
      toggleBillingPeriod();
    }
  }
  return (
    <div className={clsx("flex items-center justify-center space-x-4", className)}>
      <button type="button" className="text-sm font-medium" onClick={() => setBillingPeriod(SubscriptionBillingPeriod.MONTHLY)}>
        {t("pricing.MONTHLY")}
      </button>
      <button
        disabled={disabled}
        type="button"
        className={clsx(
          "relative rounded-full focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2",
          disabled && "cursor-not-allowed opacity-80"
        )}
        onClick={toggleBillingPeriod}
      >
        <div className={clsx("rounded-full bg-theme-500 shadow-md outline-none transition", size === "sm" && "h-4 w-8", size === "md" && "h-8 w-16")}></div>
        <div
          className={clsx(
            "absolute top-1 left-1 inline-flex transform items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-6 w-6",
            billingPeriod === 3 && "translate-x-0",
            billingPeriod === 4 && size === "sm" && "translate-x-4",
            billingPeriod === 4 && size === "md" && "translate-x-8"
          )}
        ></div>
      </button>
      <button type="button" className="text-sm font-medium" onClick={() => setBillingPeriod(SubscriptionBillingPeriod.YEARLY)}>
        {t("pricing.YEARLY")}{" "}
        {yearlyDiscount && (
          <span className="ml-1 inline-flex items-center rounded-md bg-teal-100 px-2.5 py-0.5 text-sm font-medium text-teal-800">{yearlyDiscount}</span>
        )}
      </button>
    </div>
  );
}
