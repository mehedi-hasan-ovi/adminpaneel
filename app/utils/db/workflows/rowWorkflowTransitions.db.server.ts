import { EntityWorkflowState, EntityWorkflowStep, RowWorkflowTransition } from "@prisma/client";
import { CreatedByDto } from "~/application/dtos/shared/CreatedByDto";
import { db } from "~/utils/db.server";
import { includeCreatedBy } from "../users.db.server";

export type RowWorkflowTransitionWithDetails = RowWorkflowTransition & {
  byUser: { id: string; email: string; firstName: string; lastName: string } | null;
  byApiKey?: { id: string; alias: string } | null;
  byEmail?: { id: string; subject: string } | null;
  byEventWebhook?: { id: string; endpoint: string; message: true } | null;
  workflowStep: EntityWorkflowStep & {
    fromState: EntityWorkflowState;
    toState: EntityWorkflowState;
  };
};

export async function getRowWorkflowTransitions(rowId: string): Promise<RowWorkflowTransitionWithDetails[]> {
  return await db.rowWorkflowTransition.findMany({
    where: {
      rowId,
    },
    include: {
      ...includeCreatedBy,
      workflowStep: {
        include: {
          fromState: true,
          toState: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getRowWorkflowTransition(id: string): Promise<RowWorkflowTransitionWithDetails | null> {
  return await db.rowWorkflowTransition.findUnique({
    where: {
      id,
    },
    include: {
      ...includeCreatedBy,
      workflowStep: {
        include: {
          fromState: true,
          toState: true,
        },
      },
    },
  });
}

export async function createRowWorkflowTransition(rowId: string, workflowStepId: string, createdBy: CreatedByDto): Promise<RowWorkflowTransition> {
  return await db.rowWorkflowTransition.create({
    data: {
      rowId,
      workflowStepId,
      ...createdBy,
    },
  });
}
