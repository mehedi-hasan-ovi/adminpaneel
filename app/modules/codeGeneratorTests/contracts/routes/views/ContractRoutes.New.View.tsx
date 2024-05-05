// Route View (Client component): Form for creating new row
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useActionData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import CheckPlanFeatureLimit from "~/components/core/settings/subscription/CheckPlanFeatureLimit";
import NewPageLayout from "~/components/ui/layouts/NewPageLayout";
import UrlUtils from "~/utils/app/UrlUtils";
import ContractForm from "../../components/ContractForm";
import { ContractRoutesNewApi } from "../api/ContractRoutes.New.Api";

export default function ContractRoutesNewView() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<ContractRoutesNewApi.LoaderData>();
  const actionData = useActionData<ContractRoutesNewApi.ActionData>();
  const location = useLocation();
  return (
    <NewPageLayout
      title={t("shared.create") + " " + t("Contract")}
      menu={[
        {
          title: t("Contracts"),
          routePath: UrlUtils.getParentRoute(location.pathname),
        },
        {
          title: t("shared.create"),
          routePath: "",
        },
      ]}
    >
      <div className="mx-auto max-w-2xl">
        <CheckPlanFeatureLimit item={data.featureUsage}>
          <ContractForm isCreating={true} actionData={actionData} />
        </CheckPlanFeatureLimit>
      </div>
    </NewPageLayout>
  );
}
