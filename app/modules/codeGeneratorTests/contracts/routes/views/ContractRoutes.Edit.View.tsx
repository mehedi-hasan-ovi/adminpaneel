// Route View (Client component): Form for overview and editing row
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useActionData, useOutlet, useNavigate, useLocation, useSearchParams, useSubmit } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import RowSettingsTabs from "~/components/entities/rows/RowSettingsTabs";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
import UrlUtils from "~/utils/app/UrlUtils";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import NumberUtils from "~/utils/shared/NumberUtils";
import ShareIcon from "~/components/ui/icons/ShareIcon";
import ClockIcon from "~/components/ui/icons/ClockIcon";
import PencilIcon from "~/components/ui/icons/PencilEmptyIcon";
import RowTasks from "~/components/entities/rows/RowTasks";
import RowTags from "~/components/entities/rows/RowTags";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import RowNextWorkflowStates from "~/components/entities/rows/RowNextWorkflowStates";
import RowSetManualWorkflowState from "~/components/entities/rows/RowSetManualWorkflowState";
import ContractForm from "../../components/ContractForm";
import { ContractRoutesEditApi } from "../api/ContractRoutes.Edit.Api";
import { useTypedLoaderData } from "remix-typedjson";

export default function ContractRoutesEditView() {
  const { t } = useTranslation();
  const appOrAdminData = useAppOrAdminData();
  const data = useTypedLoaderData<ContractRoutesEditApi.LoaderData>();
  const actionData = useActionData<ContractRoutesEditApi.ActionData>();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();

  function canUpdate() {
    return data.permissions.canUpdate && !!data.item.row.workflowState?.canUpdate;
  }
  function canDelete() {
    return data.permissions.canDelete && !!data.item.row.workflowState?.canDelete;
  }

  function onPerformWorkflowTransition(actionName: string) {
    const form = new FormData();
    form.set("action", "workflow-transition");
    form.set("workflow-action", actionName);
    submit(form, {
      method: "post",
    });
  }
  function onSetWorkflowState(stateName: string) {
    const form = new FormData();
    form.set("action", "workflow-set-manual-state");
    form.set("workflow-state", stateName);
    submit(form, {
      method: "post",
    });
  }
  return (
    <EditPageLayout
      title={t("shared.edit") + " " + t("Contract")}
      menu={[
        {
          title: t("Contracts"),
          routePath: UrlUtils.getParentRoute(location?.pathname),
        },
        {
          title: data.item?.name ?? t("shared.edit"),
          routePath: "",
        },
      ]}
    >
      <div className="relative items-center justify-between space-y-2 border-b border-gray-200 pb-4 sm:flex sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold uppercase">
            {data.item.prefix}-{NumberUtils.pad(data.item.row.folio ?? 0, 4)}
          </div>
          <WorkflowStateBadge state={data.item.row.workflowState} />
        </div>
        <div className="flex space-x-2">
          {appOrAdminData.isSuperAdmin && (
            <RowSetManualWorkflowState
              current={data.item.row.workflowState?.name}
              workflowStates={data.workflowStates}
              disabled={false}
              onClick={onSetWorkflowState}
            />
          )}
          <ButtonSecondary to="activity">
            <ClockIcon className="h-4 w-4 text-gray-500" />
          </ButtonSecondary>
          {data.permissions.isOwner && (
            <ButtonSecondary to="share">
              <ShareIcon className="h-4 w-4 text-gray-500" />
            </ButtonSecondary>
          )}
          {canUpdate() && (
            <ButtonSecondary
              onClick={() => {
                if (searchParams.get("view") === "edit") {
                  setSearchParams({});
                } else {
                  searchParams.set("view", "edit");
                  setSearchParams(searchParams);
                }
              }}
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </ButtonSecondary>
          )}
        </div>
      </div>

      {!data.item ? (
        <div>{t("shared.loading")}...</div>
      ) : (
        <div className="mx-auto space-y-2 pt-2 lg:flex lg:space-x-4 lg:space-y-0">
          <div className="space-y-4 lg:w-4/6">
            <ContractForm
              item={data.item}
              actionData={actionData}
              canUpdate={canUpdate()}
              canDelete={canDelete()}
              isUpdating={searchParams.get("view") === "edit"}
              onCancel={() => {
                setSearchParams({});
              }}
            />
          </div>

          <div className="space-y-4 lg:w-2/6">
            <RowNextWorkflowStates nextWorkflowSteps={data.nextWorkflowSteps} disabled={!canUpdate()} onClick={onPerformWorkflowTransition} />
            <RowTags items={data.item.row.tags} onSetTagsRoute={canUpdate() ? "tags" : undefined} />
            <RowTasks items={data.tasks} />
          </div>
        </div>
      )}

      <SlideOverWideEmpty
        withTitle={false}
        withClose={false}
        title={""}
        open={!!outlet}
        onClose={() => {
          navigate(".", { replace: true });
        }}
        className="sm:max-w-sm"
        overflowYScroll={true}
      >
        <div className="-mx-1 -mt-3">
          <div className="space-y-4">
            <RowSettingsTabs canUpdate={canUpdate()} isOwner={data.permissions.isOwner} hasTags={true} />
            {outlet}
          </div>
        </div>
      </SlideOverWideEmpty>
    </EditPageLayout>
  );
}
