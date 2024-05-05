import clsx from "clsx";
import { SubscriptionFeatureDto } from "~/application/dtos/subscriptions/SubscriptionFeatureDto";
import { PricingModel } from "~/application/enums/subscriptions/PricingModel";
import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";
import { SubscriptionFeatureLimitType } from "~/application/enums/subscriptions/SubscriptionFeatureLimitType";
import currencies from "~/application/pricing/currencies";
import NumberUtils from "~/utils/shared/NumberUtils";
import { SubscriptionPriceDto } from "~/application/dtos/subscriptions/SubscriptionPriceDto";
import { SubscriptionUsageBasedPriceDto } from "~/application/dtos/subscriptions/SubscriptionUsageBasedPriceDto";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import { Link, useLocation, useMatches, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { useRootData } from "~/utils/data/useRootData";
import { addEvent } from "~/utils/services/analyticsService";
import { useTranslation } from "react-i18next";

interface Props {
  product?: SubscriptionProductDto;
  title: string;
  description?: string;
  badge?: string;
  features: SubscriptionFeatureDto[];
  billingPeriod: SubscriptionBillingPeriod;
  currency: string;
  model: PricingModel;
  prices: SubscriptionPriceDto[];
  usageBasedPrices: SubscriptionUsageBasedPriceDto[];
  className?: string;
  alreadyOwned?: boolean;
  canSubmit?: boolean;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
}

export default function Plan({
  product,
  title,
  description,
  badge,
  features,
  billingPeriod,
  model,
  currency,
  prices,
  usageBasedPrices,
  className,
  alreadyOwned,
  canSubmit,
  isUpgrade,
  isDowngrade,
}: Props) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubscribing = navigation.state === "submitting" && navigation.formData.get("action") === "subscribe";
  const isLoading = isSubscribing && navigation.formData.get("product-id") === product?.id;
  const matches = useMatches();
  let location = useLocation();
  const rootData = useRootData();

  const [quantity, setQuantity] = useState(1);
  // const [usageBasedTiers, setUsageBasedTiers] = useState<{ from: number; to: number | undefined; prices: UsageBasedPriceDto[] }[]>([]);

  // useEffect(() => {
  //   const tiers: { from: number; to: number | undefined; prices: UsageBasedPriceDto[] }[] = [];
  //   usageBasedPrices.forEach((price) => {
  //     const tier = tiers.find((t) => t.from === price.from && t.to === price.to);
  //     if (!tier) {
  //       tiers.push({ from: price.from, to: price.to, prices: [price] });
  //     } else {
  //       tier.prices.push(price);
  //     }
  //   });
  //   setUsageBasedTiers(tiers.sort((a, b) => a.from - b.from));
  // }, [usageBasedPrices]);

  function getCurrencySymbol() {
    return currencies.find((f) => f.value === currency)?.symbol;
  }
  function getCurrency() {
    return currencies.find((f) => f.value === currency)?.value;
  }
  function getFlatPrice(): SubscriptionPriceDto | undefined {
    if (model !== PricingModel.ONCE) {
      return prices.find((f) => f.currency === currency && f.billingPeriod === billingPeriod);
    }
    return prices.find((f) => f.currency === currency && f.billingPeriod === SubscriptionBillingPeriod.ONCE);
  }

  function getFormattedPrice() {
    const price = getFlatPrice();
    if (!price) {
      return "?";
    }
    return NumberUtils.numberFormat(Number(price.price));
  }

  const errorModal = useRef<RefErrorModal>(null);
  const confirmModal = useRef<RefConfirmModal>(null);
  async function onClick() {
    const form = new FormData();
    form.set("action", "subscribe");
    form.set("product-id", product?.id?.toString() ?? "");
    form.set("billing-period", billingPeriod.toString());
    form.set("currency", currency);
    form.set("quantity", quantity.toString());
    form.set("coupon", searchParams.get("coupon")?.toString() ?? "");
    if (isUpgrade) {
      form.set("is-upgrade", "true");
    } else if (isDowngrade) {
      form.set("is-downgrade", "true");
    }
    submit(form, {
      method: "post",
    });
    // confirmModal.current?.setValue(product);
    // confirmModal.current?.show(
    //   "SaasRock v1.0 is not ready",
    //   "View pre-launch prices",
    //   "Back",
    //   "You're early! I'm still working on SaasRock pre-v1.0, checkout the roadmap at /docs/roadmap for more information or /newsletter to get notified when it's ready."
    // );

    const routeMatch = matches.find((m) => m.pathname == location.pathname);
    await addEvent({
      url: location.pathname,
      route: routeMatch?.id,
      rootData,
      action: "click-plan",
      category: "user",
      label: "pricing",
      value: t(product?.title ?? ""),
    });

    // submit(form, {
    //   method: "post",
    // });
  }
  function confirmed(product: SubscriptionProductDto | undefined) {
    if (!product) {
      return;
    }
    if (product?.title.includes("Core") || product?.title.includes("Enterprise")) {
      window.location.href = "https://alexandromg.gumroad.com/l/SaasRock";
    } else {
      window.location.href = "https://alexandromg.gumroad.com/l/SaasRockDevelopment";
    }
  }
  function isDisabled() {
    return alreadyOwned || isSubscribing || !product?.stripeId;
  }
  return (
    <>
      <div className={className}>
        <section
          className={clsx(
            "relative flex w-full flex-col rounded-lg p-7 shadow-xl",
            !badge && "border border-theme-100 dark:border-theme-800",
            badge && "border-2 border-theme-400 dark:border-theme-600"
          )}
        >
          {badge && (
            <div className="absolute top-0 -translate-y-1/2 transform rounded-full bg-theme-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              {t(badge)}
            </div>
          )}
          <div className="flex-1 space-y-6">
            {/* Title and Description */}
            <div className="flex-shrink-0 space-y-2">
              <h2 className="text-2xl font-normal">{t(title)}</h2>
              {description && <p className="text-sm text-gray-500">{t(description)}</p>}
            </div>

            {/* Price */}
            {model !== PricingModel.USAGE_BASED && (
              <div className="flex-shrink-0 truncate">
                <span className="pr-1 text-sm font-bold">{getCurrencySymbol()}</span>
                <span className="text-4xl font-medium tracking-tight">{getFormattedPrice()}</span>{" "}
                <span className="truncate uppercase text-gray-500"> {getCurrency()}</span>
                {model === PricingModel.PER_SEAT && <span className="text-gray-500">/dev</span>}
                {(() => {
                  if (getFlatPrice()?.billingPeriod === SubscriptionBillingPeriod.MONTHLY) {
                    return <span className="truncate text-gray-500">/{t("pricing.MONTHLYShort")}</span>;
                  } else if (getFlatPrice()?.billingPeriod === SubscriptionBillingPeriod.YEARLY) {
                    return <span className="truncate text-gray-500">/{t("pricing.YEARLYShort")}</span>;
                  }
                  // else if (getFlatPrice()?.billingPeriod === SubscriptionBillingPeriod.ONCE) {
                  //   return <span className="text-gray-500 text-xs"> ({t("pricing.once")})</span>;
                  // }
                })()}
                {/* <div className="text-gray-500 mt-2 text-xs italic">Cancel anytime</div> */}
              </div>
            )}

            {usageBasedPrices
              .sort((a, b) => (a.unit > b.unit ? 1 : -1))
              .filter((f) => f.currency === currency)
              .map((usageBasedPrice, idx) => {
                return (
                  <div key={idx} className="flex flex-shrink-0 flex-col">
                    <div className="text-sm font-medium">
                      <span className="">+</span> {t(usageBasedPrice.unitTitlePlural)}
                    </div>
                    <div className="mt-3">
                      <div className="-mx-4 overflow-auto ring-1 ring-gray-300 sm:-mx-6 md:mx-0 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead>
                            <tr>
                              {usageBasedPrice.tiersMode === "graduated" ? (
                                <>
                                  <th scope="col" className="truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    {t(usageBasedPrice.unitTitlePlural)}
                                  </th>
                                  <th scope="col" className="truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    {t("pricing.usageBased.units")}
                                    <span className="font-normal text-gray-500">/m</span>
                                  </th>
                                </>
                              ) : (
                                <th scope="col" className="truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                  {t("pricing.usageBased.units")}
                                  <span className="font-normal text-gray-500">/month</span>
                                </th>
                              )}
                              <th scope="col" className="truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                {t("pricing.usageBased.perUnit")}
                              </th>
                              <th scope="col" className="truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                {t("pricing.usageBased.flatFee")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageBasedPrice.tiers.map((tier, idx) => {
                              return (
                                <tr key={tier.from}>
                                  {usageBasedPrice.tiersMode === "graduated" && (
                                    <td className="relative px-3 py-2 text-sm">
                                      <div className="truncate font-medium text-gray-900 dark:text-white">
                                        <span>{idx === 0 ? t("pricing.usageBased.first") : t("pricing.usageBased.next")}</span>
                                      </div>
                                    </td>
                                  )}
                                  <td className="truncate px-3 py-2 text-sm text-gray-500 lg:table-cell">
                                    {tier.from} - {tier.to ? tier.to : "∞"}
                                  </td>
                                  <td className="truncate px-3 py-2 text-sm text-gray-500 lg:table-cell">
                                    {tier.perUnitPrice ? (
                                      <span>
                                        <>
                                          {getCurrencySymbol()}
                                          {tier.perUnitPrice ?? "-"}
                                          {/* <span className="text-xs uppercase">{getCurrency()}</span> */}
                                        </>
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="truncate px-3 py-2 text-sm text-gray-500 lg:table-cell">
                                    {tier.flatFeePrice ? (
                                      <span>
                                        <>
                                          {getCurrencySymbol() ?? ""}
                                          {tier.flatFeePrice ?? "-"}
                                        </>
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* <div className="w-full border-t"></div> */}
            {/* Features */}
            <ul className="flex-1 space-y-1.5">
              {features
                .sort((a, b) => (a.order > b.order ? 1 : -1))
                .map((feature, idxFeature) => {
                  return (
                    <li key={idxFeature}>
                      <div className="flex items-center">
                        {feature.type !== SubscriptionFeatureLimitType.NOT_INCLUDED ? (
                          <svg
                            className=" h-4 w-4 flex-shrink-0 text-theme-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className=" h-4 w-4 flex-shrink-0 text-gray-300"
                            viewBox="0 0 20 20"
                            stroke="#FFFFF"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {feature.href?.startsWith("http") ? (
                          <a
                            href={feature.href}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 truncate text-sm font-medium text-gray-600 underline hover:text-theme-500 dark:text-gray-400"
                          >
                            <span>{t(feature.title, [feature.value])}</span>
                          </a>
                        ) : feature.href?.startsWith("/") ? (
                          <Link to={feature.href} className="ml-2 truncate text-sm font-medium text-gray-600 underline hover:text-theme-500 dark:text-gray-400">
                            <span>{t(feature.title, [feature.value])}</span>
                          </Link>
                        ) : (
                          <span className="ml-2 truncate text-sm font-medium text-gray-600 dark:text-gray-400">
                            <span>{t(feature.title, [feature.value])}</span>
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>

            {canSubmit && (
              <div className="mt-4 space-y-2">
                {!alreadyOwned && getFlatPrice()?.price !== 0 && (model === PricingModel.PER_SEAT || model === PricingModel.ONCE) ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.currentTarget.value))}
                      disabled={isDisabled()}
                      className={clsx(
                        "relative block w-full appearance-none rounded-md rounded-b-md border border-gray-300 px-3 py-2 text-center text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm",
                        isDisabled() && "cursor-not-allowed"
                      )}
                    />
                    <SubscribeOrBuyButton
                      isPreview={product?.stripeId === undefined}
                      model={model}
                      price={getFlatPrice()}
                      badge={badge}
                      disabled={isDisabled()}
                      loading={isLoading}
                      onClick={onClick}
                      alreadyOwned={alreadyOwned}
                      isUpgrade={isUpgrade}
                      isDowngrade={isDowngrade}
                    />
                  </div>
                ) : (
                  <SubscribeOrBuyButton
                    model={model}
                    price={getFlatPrice()}
                    badge={badge}
                    disabled={isDisabled()}
                    loading={isLoading}
                    onClick={onClick}
                    alreadyOwned={alreadyOwned}
                    isUpgrade={isUpgrade}
                    isDowngrade={isDowngrade}
                  />
                )}
              </div>
            )}
          </div>
        </section>
        <ErrorModal ref={errorModal} />
        <ConfirmModal ref={confirmModal} onYes={confirmed} />
      </div>
    </>
  );
}

interface SubscribeOrBuyButtonProps {
  isPreview?: boolean;
  model: PricingModel;
  badge?: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  alreadyOwned?: boolean;
  price?: SubscriptionPriceDto;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
}
function SubscribeOrBuyButton({ isPreview, model, price, badge, disabled, loading, onClick, alreadyOwned, isUpgrade, isDowngrade }: SubscribeOrBuyButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        loading && "base-spinner cursor-not-allowed",
        badge && !disabled
          ? "group flex w-full items-center justify-center space-x-2 rounded-md border border-theme-600 bg-theme-600 px-8 py-2 text-sm font-medium text-theme-50 "
          : "group flex w-full items-center justify-center space-x-2 rounded-md border border-gray-200 bg-white px-8 py-2 text-sm font-medium text-accent-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white",
        badge && !disabled && "hover:bg-theme-700 hover:text-accent-100",
        !badge && !disabled && "hover:border-gray-300 hover:bg-gray-50 hover:dark:bg-gray-800",
        disabled && "cursor-not-allowed",
        alreadyOwned && "opacity-70"
      )}
    >
      {alreadyOwned ? (
        t("pricing.alreadyOwned")
      ) : isPreview ? (
        <>{t("pricing.notCreated")}</>
      ) : isUpgrade ? (
        <>{t("shared.upgrade")} ✨</>
      ) : isDowngrade ? (
        <>{t("shared.downgrade")}</>
      ) : (
        <span>
          <>
            {price && price.price === 0 ? (
              <span>{t("pricing.getItForFree")}</span>
            ) : (
              <span>{model === PricingModel.ONCE ? t("pricing.buy") : t("pricing.subscribe")}</span>
            )}
          </>
        </span>
      )}
    </button>
  );
}
