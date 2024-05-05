import { useTranslation } from "react-i18next";
import { Link, Outlet } from "@remix-run/react";
import CheckPlanFeatureLimit from "~/components/core/settings/subscription/CheckPlanFeatureLimit";
import RowForm from "~/components/entities/rows/RowForm";
import NewPageLayout from "~/components/ui/layouts/NewPageLayout";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import RowHelper from "~/utils/helpers/RowHelper";
import clsx from "clsx";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { Rows_New } from "../routes/Rows_New.server";
import { useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { Fragment, useEffect } from "react";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import toast from "react-hot-toast";

interface Props {
  showBreadcrumb?: boolean;
  className?: string;
}
export default function RowNewRoute({ showBreadcrumb = true, className }: Props) {
  const data = useTypedLoaderData<Rows_New.LoaderData>();
  const { t } = useTranslation();
  const actionData = useTypedActionData<Rows_New.ActionData>();

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, t]);

  return (
    <Fragment>
      <NewPageLayout
        className={className}
        title={t("shared.create") + " " + t(data.entityData.entity.title)}
        menu={
          showBreadcrumb
            ? [
                {
                  title: t(data.entityData.entity.titlePlural),
                  routePath: EntityHelper.getRoutes({ routes: data.routes, entity: data.entityData.entity })?.list,
                },
                {
                  title: t("shared.new"),
                  routePath: EntityHelper.getRoutes({ routes: data.routes, entity: data.entityData.entity })?.new,
                },
              ]
            : []
        }
      >
        <div className="space-y-4">
          {actionData?.newRow && actionData?.saveAndAdd ? (
            <RowCreated entityData={data.entityData} routes={data.routes} newRow={actionData?.newRow} />
          ) : (
            <CheckPlanFeatureLimit item={data.entityData.featureUsageEntity}>
              <RowForm
                key={actionData?.newRow?.id}
                entity={data.entityData.entity}
                routes={data.routes}
                onCreatedRedirect={data.entityData.entity.onCreated ?? undefined}
                allEntities={data.allEntities}
                relationshipRows={data.relationshipRows}
                adding={true}
              />
              <Outlet />
            </CheckPlanFeatureLimit>
          )}
        </div>
      </NewPageLayout>
    </Fragment>
  );
}

function RowCreated({ entityData, routes, newRow }: { entityData: EntitiesApi.GetEntityData; routes: EntitiesApi.Routes; newRow: RowWithDetails }) {
  const { t } = useTranslation();
  // const params = useParams();
  return (
    <div>
      {/* <NotificationSimple /> */}
      <div className="text-sm font-medium text-gray-800">{t("shared.created")}</div>
      <div className="group relative mt-2 w-full rounded-md border-2 border-dashed border-gray-300 bg-white text-left text-sm hover:border-gray-500">
        <Link to={EntityHelper.getRoutes({ routes, entity: entityData.entity, item: newRow })?.overview ?? ""} className="grid grid-cols-2 gap-2 px-4 py-3">
          {entityData.entity.properties.filter((f) => f.isDisplay).length === 0 ? (
            <div>{RowHelper.getTextDescription({ entity: entityData.entity, item: newRow, t })}</div>
          ) : (
            <>
              {entityData.entity.properties
                .filter((f) => f.isDisplay)
                .sort((a, b) => a.order - b.order)
                .map((property, idx) => (
                  <div key={property.id} className={clsx(idx === 0 ? "font-medium text-gray-700" : "text-gray-500")}>
                    <div className="flex flex-col">
                      <div className="text-xs uppercase text-gray-400">{t(property.title)}</div>
                      <div>{RowHelper.getCellValue({ entity: entityData.entity, property, item: newRow })}</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </Link>
      </div>
      <div className="mt-2 flex justify-between space-x-2">
        <ButtonSecondary to={EntityHelper.getRoutes({ routes, entity: entityData.entity })?.list}>{t("shared.viewAll")}</ButtonSecondary>

        <div className="items-between flex space-x-2">
          <ButtonSecondary to={EntityHelper.getRoutes({ routes, entity: entityData.entity, item: newRow })?.overview}>{t("shared.view")}</ButtonSecondary>
          <ButtonPrimary autoFocus to=".">
            {t("shared.addAnother")}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}
