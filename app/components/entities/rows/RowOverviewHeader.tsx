import { Fragment, ReactNode, useRef } from "react";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import TrashEmptyIcon from "~/components/ui/icons/TrashEmptyIcon";
import EntityHelper from "~/utils/helpers/EntityHelper";
import RowSetManualWorkflowState from "./RowSetManualWorkflowState";
import RowTitle from "./RowTitle";
import { RowsApi } from "~/utils/api/RowsApi";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { useSubmit } from "@remix-run/react";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { t } from "i18next";
import { getUserHasPermission, getEntityPermission } from "~/utils/helpers/PermissionsHelper";
import ShareIcon from "~/components/ui/icons/ShareIcon";
import PencilIcon from "~/components/ui/icons/PencilIcon";
import RunPromptFlowButtons from "~/modules/promptBuilder/components/run/RunPromptFlowButtons";

export default function RowOverviewHeader({
  rowData,
  item,
  canUpdate,
  isEditing,
  routes,
  title,
  options,
  buttons,
}: {
  rowData: RowsApi.GetRowData;
  item: RowWithDetails;
  canUpdate: boolean;
  isEditing: boolean;
  routes: EntitiesApi.Routes | undefined;
  title?: React.ReactNode;
  options?: {
    hideTitle?: boolean;
    hideMenu?: boolean;
    hideShare?: boolean;
    hideTags?: boolean;
    hideTasks?: boolean;
    hideActivity?: boolean;
    disableUpdate?: boolean;
    disableDelete?: boolean;
  };
  buttons?: ReactNode;
}) {
  const appOrAdminData = useAppOrAdminData();
  const submit = useSubmit();

  const confirmDelete = useRef<RefConfirmModal>(null);

  function onSetWorkflowState(stateName: string) {
    const form = new FormData();
    form.set("action", "workflow-set-manual-state");
    form.set("workflow-state", stateName);
    submit(form, {
      method: "post",
    });
  }

  function getEditRoute() {
    if (isEditing) {
      return EntityHelper.getRoutes({ routes, entity: rowData.entity, item })?.overview;
    } else {
      return EntityHelper.getRoutes({ routes, entity: rowData.entity, item })?.edit;
    }
  }
  function canDelete() {
    return !options?.disableDelete && getUserHasPermission(appOrAdminData, getEntityPermission(rowData.entity, "delete")) && rowData.rowPermissions.canDelete;
  }

  function onDelete() {
    confirmDelete.current?.show(t("shared.confirmDelete"), t("shared.delete"), t("shared.cancel"), t("shared.warningCannotUndo"));
  }
  function onDeleteConfirm() {
    const form = new FormData();
    form.set("action", "delete");
    submit(form, {
      method: "post",
    });
  }

  return (
    <div className="relative items-center justify-between space-y-2 border-b border-gray-200 pb-4 sm:flex sm:space-x-4 sm:space-y-0">
      <div className="flex flex-col truncate">
        <div className="flex items-center space-x-2 truncate text-xl font-bold">
          {title ?? <RowTitle entity={rowData.entity} item={item} />}
          {rowData.entity.hasWorkflow && item.workflowState && (
            <div className="">
              <WorkflowStateBadge state={item.workflowState} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:justify-end">
        <div className="flex items-end space-x-2 space-y-0">
          {rowData.entity.workflowStates.length > 0 && appOrAdminData.isSuperUser && (
            <RowSetManualWorkflowState
              current={item.workflowState?.name}
              workflowStates={rowData.entity.workflowStates}
              disabled={!canUpdate}
              onClick={onSetWorkflowState}
            />
          )}

          {canUpdate || item.createdByUserId === appOrAdminData?.user?.id || appOrAdminData?.isSuperUser ? (
            <Fragment>
              {buttons}
              {!options?.hideShare && (item.createdByUserId === appOrAdminData?.user?.id || appOrAdminData.isSuperAdmin) && (
                <ButtonSecondary to="share">
                  <ShareIcon className="h-4 w-4 text-gray-500" />
                </ButtonSecondary>
              )}
              {rowData.entity.onEdit !== "overviewAlwaysEditable" && (
                <ButtonSecondary disabled={!EntityHelper.getRoutes({ routes, entity: rowData.entity, item })?.edit} to={getEditRoute()}>
                  <PencilIcon className="h-4 w-4 text-gray-500" />
                </ButtonSecondary>
              )}
              {isEditing && canDelete() && (
                <ButtonSecondary onClick={onDelete}>
                  <TrashEmptyIcon className="h-4 w-4 text-gray-500" />
                </ButtonSecondary>
              )}
              <RunPromptFlowButtons type="edit" fromRows={[item]} toRows={[item]} promptFlows={rowData.promptFlows} />
            </Fragment>
          ) : appOrAdminData.isSuperAdmin ? (
            <ButtonSecondary to="share">
              <ShareIcon className="h-4 w-4 text-gray-500" />
            </ButtonSecondary>
          ) : null}
        </div>
      </div>

      <ConfirmModal ref={confirmDelete} destructive onYes={onDeleteConfirm} />
    </div>
  );
}
