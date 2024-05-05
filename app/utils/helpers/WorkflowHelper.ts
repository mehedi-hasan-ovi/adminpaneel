import { DefaultVisibility } from "~/application/dtos/shared/DefaultVisibility";
import { WorkflowInternalState } from "~/application/dtos/workflows/WorkflowInternalState";
import { Colors } from "~/application/enums/shared/Colors";
import { EntityWorkflowStepWithDetails } from "../db/workflows/workflowSteps.db.server";

function getWorkflowInternalStatusColor(status: WorkflowInternalState) {
  switch (status) {
    case WorkflowInternalState.Draft:
      return Colors.GRAY;
    case WorkflowInternalState.Pending:
      return Colors.YELLOW;
    case WorkflowInternalState.Completed:
      return Colors.GREEN;
    case WorkflowInternalState.Cancelled:
      return Colors.RED;
    default:
      return Colors.GRAY;
  }
}

function getWorkflowStepAssignToItems(step: EntityWorkflowStepWithDetails): string[] {
  switch (step.assignTo) {
    case DefaultVisibility.Private:
      return [""];
    case DefaultVisibility.Tenant:
      return step.assignees.map((f) => f.tenant?.name ?? "") ?? [];
    // case DefaultVisibility.Roles:
    //   return step.assignees.map((f) => f.role?.name ?? "");
    // case DefaultVisibility.Groups:
    //   return step.assignees.map((f) => f.group?.name ?? "");
    // case DefaultVisibility.Users:
    //   return step.assignees.map((f) => `${f.user?.firstName} ${f.user?.lastName} (${f.user?.email})`);
    default:
      return [""];
  }
}

export default {
  getWorkflowInternalStatusColor,
  // getWorkflowStepAssignToTitle,
  getWorkflowStepAssignToItems,
};
