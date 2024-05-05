import { TFunction } from "react-i18next";
import { SubscriptionPriceDto } from "~/application/dtos/subscriptions/SubscriptionPriceDto";
import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";

export function getUsageBasedUnitTitle(t: TFunction, name: string) {
  if (name === "api") {
    return t("models.apiCall.object");
  }
  return t(`models.${name}.object`);
}

export function getUsageBasedUnitTitlePlural(t: TFunction, name: string) {
  if (name === "api") {
    return t("models.apiCall.plural");
  }
  return t(`models.${name}.plural`);
}

export function getYearlyDiscount(prices: SubscriptionPriceDto[], currency: string) {
  const priceYearly = prices.find((f) => f.billingPeriod === SubscriptionBillingPeriod.YEARLY && f.price > 0 && f.currency === currency);
  const priceMonthly = prices.find((f) => f.billingPeriod === SubscriptionBillingPeriod.MONTHLY && f.price > 0 && f.currency === currency);
  if (priceYearly?.price && priceMonthly?.price) {
    const discount = 100 - (Number(priceYearly.price) * 100) / (Number(priceMonthly.price) * 12);
    if (discount !== 0) {
      return "-" + discount.toFixed(0) + "%";
    }
  }
  return undefined;
}
