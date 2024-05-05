import { DefaultLogActions } from "~/application/dtos/shared/DefaultLogActions";
import { EntityWithDetails } from "../db/entities/entities.db.server";
import { RowWithDetails } from "../db/entities/rows.db.server";
import { createManualRowLog } from "../db/logs.db.server";
import { createRowWorkflowTransition, getRowWorkflowTransition } from "../db/workflows/rowWorkflowTransitions.db.server";
import { getWorkflowStateByName } from "../db/workflows/workflowStates.db.server";
import { getWorkflowStepByAction } from "../db/workflows/workflowSteps.db.server";
import { updateRowWorkflowState } from "../services/WorkflowService";

export namespace WorkflowsApi {
  export async function performTransition({
    row,
    entity,
    actionName,
    byUserId,
    request,
  }: {
    row: RowWithDetails;
    entity: EntityWithDetails;
    actionName: string;
    byUserId: string;
    request: Request;
  }) {
    const workflowStep = await getWorkflowStepByAction(entity, actionName);
    if (!workflowStep) {
      throw Error(`Workflow step not found for entity ${entity.name ?? entity.id} and action ${actionName}`);
    }
    await updateRowWorkflowState(row.id, workflowStep.toStateId);
    const transition = await createRowWorkflowTransition(row.id, workflowStep.id, { byUserId });
    if (!transition) {
      throw Error(`Failed to create workflow transition for entity ${entity.name ?? entity.id} and action ${actionName}`);
    }
    const workflowTransition = await getRowWorkflowTransition(transition.id);
    await createManualRowLog(
      {
        tenantId: row.tenantId,
        createdByUserId: byUserId,
        createdByApiKey: null,
        action: DefaultLogActions.WorkflowTransition,
        entity,
        item: row,
        workflowTransition,
      },
      request
    );
    return workflowTransition!;
  }
  export async function setState({ rowId, entity, stateName }: { rowId: string; entity: { id?: string; name?: string }; stateName: string }) {
    const workflowState = await getWorkflowStateByName(entity, stateName);
    if (!workflowState) {
      throw Error(`Workflow state not found for entity ${entity.name ?? entity.id} and state ${stateName}`);
    }
    await updateRowWorkflowState(rowId, workflowState.id);
    return workflowState;
  }
}
