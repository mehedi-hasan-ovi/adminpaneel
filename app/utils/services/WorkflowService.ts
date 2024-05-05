import { EntityWorkflowState, EntityWorkflowStep } from "@prisma/client";
import { CreatedByDto } from "~/application/dtos/shared/CreatedByDto";
import { DefaultLogActions } from "~/application/dtos/shared/DefaultLogActions";
import { DefaultVisibility } from "~/application/dtos/shared/DefaultVisibility";
import { Colors } from "~/application/enums/shared/Colors";
import { db } from "../db.server";
import { EntityWithDetails, getEntityById } from "../db/entities/entities.db.server";
import { getRowById, RowWithDetails } from "../db/entities/rows.db.server";
import { createManualRowLog } from "../db/logs.db.server";
import { createRowWorkflowTransition, getRowWorkflowTransition } from "../db/workflows/rowWorkflowTransitions.db.server";
import { createWorkflowState, EntityWorkflowStateWithSteps, getWorkflowStates } from "../db/workflows/workflowStates.db.server";
import { createWorkflowStep } from "../db/workflows/workflowSteps.db.server";
import { createRowWorkflowTransitionEvent } from "./events/rowsEventsService";

export async function createDefaultEntityWorkflow(entityId: string) {
  const statePending = await createState(entityId, {
    order: 1,
    name: "pending",
    title: "Pending",
    color: Colors.YELLOW,
    canUpdate: true,
    canDelete: true,
    emailSubject: "",
    emailBody: "",
  });
  const stateCompleted = await createState(entityId, {
    order: 2,
    name: "completed",
    title: "Completed",
    color: Colors.GREEN,
    canUpdate: false,
    canDelete: false,
    emailSubject: "{user} has accepted your request",
    emailBody: "<p>{user} accepted your request {folio}.</p>",
  });
  const stateCancelled = await createState(entityId, {
    order: 3,
    name: "cancelled",
    title: "Cancelled",
    color: Colors.RED,
    canUpdate: false,
    canDelete: false,
    emailSubject: "{user} has rejected your request",
    emailBody: "<p>{user} rejected your request {folio}.</p>",
  });

  await createStep(entityId, "Cancel", statePending, stateCancelled, DefaultVisibility.Private);
  await createStep(entityId, "Done", statePending, stateCompleted, DefaultVisibility.Private);
  await createStep(entityId, "Recall", stateCompleted, statePending, DefaultVisibility.Private);

  // await createStep(entityId, "Send to Manager", stateDraft, statePendingApprovalByManager, []);
  // await createStep(entityId, "Recall", statePendingApprovalByManager, stateDraft, []);
  // await createStep(entityId, "Reject", statePendingApprovalByManager, stateRejected, [fakeRoleService.roles[1]]);
  // await createStep(entityId, "Send to Manager", stateRejected, statePendingApprovalByManager, []);
  // await createStep(entityId, "Send to Director", statePendingApprovalByManager, statePendingApprovalByDirector, [fakeRoleService.roles[1]]);
  // await createStep(entityId, "Reject", statePendingApprovalByDirector, stateRejected, [fakeRoleService.roles[3]]);
  // await createStep(entityId, "Accept", statePendingApprovalByDirector, stateCompleted, [fakeRoleService.roles[3]]);
  // await createStep(entityId, "Cancel", stateRejected, stateCancelled, [fakeRoleService.roles[3]]);
}

export async function createCustomEntityWorkflowStates(
  entityId: string,
  workflowStates: { name: string; title: string; color: Colors; steps?: { action: string; toState: string }[] }[] | undefined | null,
  workflowSteps: { fromState: string; action: string; toState: string }[] | undefined | null
) {
  if (!workflowStates) {
    return;
  }
  const states = await Promise.all(
    workflowStates.map(async (workflowState, idx) => {
      const state = await createState(entityId, {
        order: idx + 1,
        name: workflowState.name,
        title: workflowState.title,
        color: workflowState.color,
        canUpdate: true,
        canDelete: true,
        emailSubject: "",
        emailBody: "",
      });
      return state;
    })
  );

  if (workflowSteps) {
    await Promise.all(
      workflowSteps.map(async (workflowStep) => {
        const fromState = states.find((state) => state.name === workflowStep.fromState);
        const toState = states.find((state) => state.name === workflowStep.toState);
        if (!fromState) {
          throw new Error("From state not found: " + workflowStep.fromState);
        }
        if (!toState) {
          throw new Error("To state not found: " + workflowStep.toState);
        }
        const step = await createStep(entityId, workflowStep.action, fromState!, toState!, "");
        return step;
      })
    );
  }
}

async function createState(
  entityId: string,
  state: {
    order: number;
    name: string;
    title: string;
    color: Colors;
    canUpdate: boolean;
    canDelete: boolean;
    emailSubject: string;
    emailBody: string;
  }
) {
  return await createWorkflowState({
    entityId,
    ...state,
  });
}

async function createStep(entityId: string, action: string, fromState: EntityWorkflowState, toState: EntityWorkflowState, assignTo: string) {
  return await createWorkflowStep({
    entityId,
    action,
    fromStateId: fromState.id,
    toStateId: toState.id,
    assignTo,
  });
}

export async function setRowInitialWorkflowState(entityId: string, rowId: string, workflowStateName?: string) {
  let workflowState: EntityWorkflowStateWithSteps | undefined;
  const workflowStates = await getWorkflowStates(entityId);
  if (workflowStateName) {
    workflowState = workflowStates.find((state) => state.name === workflowStateName);
  } else if (workflowStates.length > 0) {
    workflowState = workflowStates[0];
  }
  if (!workflowState) {
    return;
  }
  await updateRowWorkflowState(rowId, workflowState.id);
  const row = await getRowById(rowId);
  if (row) {
    const entity = await getEntityById({ tenantId: null, id: entityId });
    await createRowWorkflowTransitionEvent(row.tenantId, {
      entity: { id: row.entityId, name: entity?.name ?? "", slug: entity?.slug ?? "" },
      tenantId: row.tenantId,
      row: { id: row.id, folio: row.folio },
      state: { id: row.workflowState!.id, name: row.workflowState!.name },
      by: {
        byUserId: row.createdByUserId,
        byApiKeyId: row.createdByApiKeyId,
      },
    });
  }
}

export async function performRowWorkflowStep(
  entity: EntityWithDetails,
  row: RowWithDetails,
  workflowStep: EntityWorkflowStep,
  createdBy: CreatedByDto,
  request?: Request
) {
  if (workflowStep) {
    await updateRowWorkflowState(row.id, workflowStep.toStateId);
    const transition = await createRowWorkflowTransition(row.id, workflowStep.id, createdBy);
    const workflowTransition = await getRowWorkflowTransition(transition.id);
    await createManualRowLog(
      {
        tenantId: row.tenantId,
        createdByUserId: createdBy.byUserId ?? null,
        createdByApiKey: createdBy.byApiKeyId ?? null,
        action: DefaultLogActions.WorkflowTransition,
        entity,
        item: row,
        workflowTransition,
      },
      request
    );
    await createRowWorkflowTransitionEvent(row.tenantId, {
      entity: { id: row.entityId, name: entity?.name ?? "", slug: entity?.slug ?? "" },
      tenantId: row.tenantId,
      row: { id: row.id, folio: row.folio },
      state: { id: row.workflowState!.id, name: row.workflowState!.name },
      by: {
        byUserId: row.createdByUserId,
        byApiKeyId: row.createdByApiKeyId,
      },
    });
    return workflowTransition;
  }
}

export async function updateRowWorkflowState(id: string, workflowStateId: string) {
  return await db.row.update({
    where: {
      id,
    },
    data: {
      workflowStateId,
    },
  });
}

// async function getEntityById(id: string): Promise<EntityWithDetails | null> {
//   return await db.entity.findUnique({
//     where: {
//       id,
//     },
//     include: {
//       views: true,
//       workflowStates: true,
//       workflowSteps: true,
//       properties: {
//         orderBy: { order: "asc" },
//         include: {
//           attributes: true,
//           options: {
//             orderBy: {
//               order: "asc",
//             },
//           },
//         },
//       },
//     },
//   });
// }
