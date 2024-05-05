import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { DefaultVisibility } from "~/application/dtos/shared/DefaultVisibility";
import { EntityWorkflowStepWithDetails } from "~/utils/db/workflows/workflowSteps.db.server";
import VisibilityHelper from "~/utils/helpers/VisibilityHelper";
import WorkflowHelper from "~/utils/helpers/WorkflowHelper";

interface Props {
  step: EntityWorkflowStepWithDetails;
}
export default function WorkflowStepAssignTo({ step }: Props) {
  const { t } = useTranslation();
  function assignees() {
    return WorkflowHelper.getWorkflowStepAssignToItems(step);
  }
  return (
    <div className="flex flex-col text-sm font-medium text-gray-700">
      <div className={clsx(step.assignTo === DefaultVisibility.Private && "text-gray-400")}>{VisibilityHelper.getVisibilityTitle(t, step.assignTo)}</div>
      <div className="flex items-center space-x-1 truncate">
        {assignees().map((item, idx) => {
          return (
            <div key={idx}>
              {item} {idx !== assignees().length - 1 && ", "}
            </div>
          );
        })}
      </div>
    </div>
  );
}
