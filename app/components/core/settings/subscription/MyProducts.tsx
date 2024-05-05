import { useTranslation } from "react-i18next";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import { Link } from "@remix-run/react";
import { useAppData } from "~/utils/data/useAppData";
import TenantProduct from "./TenantProduct";
import { TenantSubscriptionProductWithDetails } from "~/utils/db/subscriptions/tenantSubscriptionProducts.db.server";

interface Props {
  items: TenantSubscriptionProductWithDetails[];
  onCancel?: (item: TenantSubscriptionProductWithDetails) => void;
}

export default function MyProducts({ items, onCancel }: Props) {
  const { t } = useTranslation();

  const appData = useAppData();

  return (
    <div>
      {items.length === 0 ? (
        <>
          <WarningBanner title={t("settings.subscription.noSubscription")} text={""}>
            <Link to={`/subscribe/${appData.currentTenant.slug}`} className="underline">
              {t("settings.subscription.viewAllProducts")}.
            </Link>
          </WarningBanner>
        </>
      ) : (
        <>
          <div className="grid gap-2">
            {items.map((item, idx) => {
              return <TenantProduct key={idx} item={item} onCancel={onCancel} />;
            })}
          </div>

          {/* <div className="flex justify-end mt-2 text-sm">
            <Link to={`/subscribe/${appData.currentTenant.slug}`} className="underline">
              {t("settings.subscription.viewAllProducts")}
            </Link>
          </div> */}
        </>
      )}
    </div>
  );
}
