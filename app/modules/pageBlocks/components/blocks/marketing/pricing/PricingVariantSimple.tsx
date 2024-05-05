import { useSearchParams } from "@remix-run/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import PlansGrouped from "~/components/core/settings/subscription/plans/PlansGrouped";
import InfoBanner from "~/components/ui/banners/InfoBanner";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { useRootData } from "~/utils/data/useRootData";
import { PricingBlockDto } from "./PricingBlockUtils";
import PricingContactUs from "./shared/PricingContactUs";

export default function PricingVariantSimple({ item }: { item: PricingBlockDto }) {
  const { t } = useTranslation();
  const rootData = useRootData();
  const [, setSearchParams] = useSearchParams();
  const confirmModal = useRef<RefConfirmModal>(null);
  function onShowCoupon() {
    confirmModal.current?.show(t("pricing.coupons.object"));
  }
  function onApplyCoupon(coupon: string) {
    setSearchParams({ coupon });
  }
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto antialiased">
          {item.allowCoupons && (
            <>
              <div className="text-center">
                {!item.data?.coupon && (
                  <button type="button" onClick={onShowCoupon} className="mt-2 text-base leading-6 text-gray-500 hover:underline dark:text-gray-400">
                    {t("pricing.coupons.iHaveACoupon")}.
                  </button>
                )}
              </div>
              {item.data?.coupon && (
                <div className="mt-10">
                  {item.data?.coupon.error ? (
                    <WarningBanner title="Invalid coupon" text={item.data?.coupon.error} />
                  ) : (
                    <InfoBanner title={<>{t("pricing.coupons.applied")}</>} text={""}>
                      <div>
                        {t("pricing.coupons.success")}:{" "}
                        <span className="font-medium">{item.data?.coupon.stripeCoupon?.name ?? item.data?.coupon.stripeCoupon?.id}</span>
                      </div>
                    </InfoBanner>
                  )}
                </div>
              )}
            </>
          )}

          {item.data && (
            <main className="py-10 lg:mx-4">
              <PlansGrouped items={item.data?.items} canSubmit={!rootData.authenticated && rootData.appConfiguration.subscription.allowSubscribeBeforeSignUp} />
            </main>
          )}
          {item.contactUs && <PricingContactUs item={item.contactUs} />}
          <ConfirmModal ref={confirmModal} onYes={onApplyCoupon} inputType="string" placeholder={t("pricing.coupons.typeCode")} />
        </div>
      </div>
    </>
  );
}
