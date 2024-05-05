// Route View (Client component): Form for creating new row
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { useActionData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import CheckPlanFeatureLimit from "~/components/core/settings/subscription/CheckPlanFeatureLimit";
import NewPageLayout from "~/components/ui/layouts/NewPageLayout";
import UrlUtils from "~/utils/app/UrlUtils";
import AllPropertyTypesEntityForm from "../../components/AllPropertyTypesEntityForm";
import { AllPropertyTypesEntityRoutesNewApi } from "../api/AllPropertyTypesEntityRoutes.New.Api";
import { useTypedLoaderData } from "remix-typedjson";

export default function AllPropertyTypesEntityRoutesNewView() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<AllPropertyTypesEntityRoutesNewApi.LoaderData>();
  const actionData = useActionData<AllPropertyTypesEntityRoutesNewApi.ActionData>();
  const location = useLocation();
  return (
    <NewPageLayout
      title={t("shared.create") + " " + t("All Property Types Entity")}
      menu={[
        {
          title: t("All Property Types Entity"),
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
          <AllPropertyTypesEntityForm isCreating={true} actionData={actionData} />
        </CheckPlanFeatureLimit>
      </div>
    </NewPageLayout>
  );
}
