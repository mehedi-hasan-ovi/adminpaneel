import { EntityWorkflowStep, Tenant, Role, Group, EntityWorkflowState, EntityWorkflowStepAssignee } from "@prisma/client";
import { db } from "~/utils/db.server";
import { UserSimple } from "../users.db.server";
import UserModelHelper from "~/utils/helpers/models/UserModelHelper";

export type EntityWorkflowStepWithDetails = EntityWorkflowStep & {
  assignees: (EntityWorkflowStepAssignee & {
    tenant: Tenant | null;
    role: Role | null;
    group: Group | null;
    user: UserSimple | null;
  })[];
  fromState: EntityWorkflowState;
  toState: EntityWorkflowState;
};

export async function getWorkflowSteps(entityId: string): Promise<EntityWorkflowStepWithDetails[]> {
  return await db.entityWorkflowStep.findMany({
    where: {
      entityId,
    },
    include: {
      fromState: true,
      toState: true,
      assignees: {
        include: {
          tenant: true,
          role: true,
          group: true,
          ...UserModelHelper.includeSimpleUser,
        },
      },
    },
    orderBy: {
      fromState: {
        order: "asc",
      },
    },
  });
}

export async function getWorkflowStepsFromState(entityId: string, fromStateId: string): Promise<EntityWorkflowStepWithDetails[]> {
  return await db.entityWorkflowStep.findMany({
    where: {
      fromStateId,
      entityId,
    },
    include: {
      fromState: true,
      toState: true,
      assignees: {
        include: {
          tenant: true,
          role: true,
          group: true,
          ...UserModelHelper.includeSimpleUser,
        },
      },
    },
    orderBy: {
      toState: {
        order: "asc",
      },
    },
  });
}

export async function getNextWorkflowSteps(fromStateId?: string): Promise<EntityWorkflowStepWithDetails[]> {
  if (!fromStateId) {
    return [];
  }
  return await db.entityWorkflowStep.findMany({
    where: {
      fromStateId,
    },
    include: {
      fromState: true,
      toState: true,
      assignees: {
        include: {
          tenant: true,
          role: true,
          group: true,
          ...UserModelHelper.includeSimpleUser,
        },
      },
    },
    orderBy: {
      toState: {
        order: "asc",
      },
    },
  });
}

export async function getWorkflowStep(id: string): Promise<EntityWorkflowStepWithDetails | null> {
  return await db.entityWorkflowStep.findUnique({
    where: {
      id,
    },
    include: {
      fromState: true,
      toState: true,
      assignees: {
        include: {
          tenant: true,
          role: true,
          group: true,
          ...UserModelHelper.includeSimpleUser,
        },
      },
    },
  });
}

export async function getWorkflowStepByAction(entity: { id?: string; name?: string }, actionName: string): Promise<EntityWorkflowStepWithDetails | null> {
  if (!entity.id && !entity.name) {
    return null;
  }
  const entityFilter = entity.id ? { id: entity.id } : { name: entity.name };
  const item = await db.entityWorkflowStep.findFirst({
    where: {
      entity: entityFilter,
      action: actionName,
    },
    include: {
      fromState: true,
      toState: true,
      assignees: {
        include: {
          tenant: true,
          role: true,
          group: true,
          ...UserModelHelper.includeSimpleUser,
        },
      },
    },
  });
  if (!item) {
    return null;
  }
  return item;
}

export async function createWorkflowStep(data: { entityId: string; action: string; fromStateId: string; toStateId: string; assignTo: string }) {
  return await db.entityWorkflowStep.create({
    data,
  });
}

export async function updateWorkflowStep(
  id: string,
  data: { entityId?: string; action?: string; fromStateId?: string; toStateId?: string; assignTo?: string }
) {
  return await db.entityWorkflowStep.update({
    where: { id },
    data,
  });
}

export async function deleteWorkflowStep(id: string) {
  return await db.entityWorkflowStep.delete({
    where: { id },
  });
}
