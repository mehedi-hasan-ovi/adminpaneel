import { EntityWorkflowState, EntityWorkflowStep } from "@prisma/client";
import { Colors } from "~/application/enums/shared/Colors";
import { db } from "~/utils/db.server";

export type EntityWorkflowStateWithSteps = EntityWorkflowState & {
  fromStates: EntityWorkflowStep[];
  toStates: EntityWorkflowStep[];
};

export async function getWorkflowStates(entityId: string): Promise<EntityWorkflowStateWithSteps[]> {
  return await db.entityWorkflowState.findMany({
    where: {
      entityId,
    },
    include: {
      fromStates: true,
      toStates: true,
    },
    orderBy: [{ order: "asc" }],
  });
}

export async function getWorkflowStatesByEntity(entity: { id?: string; name?: string }): Promise<EntityWorkflowStateWithSteps[]> {
  if (!entity.id && !entity.name) {
    return [];
  }
  const entityFilter = entity.id ? { id: entity.id } : { name: entity.name };
  return await db.entityWorkflowState.findMany({
    where: {
      entity: entityFilter,
    },
    include: {
      fromStates: true,
      toStates: true,
    },
    orderBy: [{ order: "asc" }],
  });
}

export async function getWorkflowState(id: string): Promise<EntityWorkflowStateWithSteps | null> {
  return await db.entityWorkflowState.findUnique({
    where: {
      id,
    },
    include: {
      fromStates: true,
      toStates: true,
    },
  });
}

export async function getWorkflowStateByName(entity: { id?: string; name?: string }, stateName: string): Promise<EntityWorkflowStateWithSteps | null> {
  if (!entity.id && !entity.name) {
    return null;
  }
  const entityFilter = entity.id ? { id: entity.id } : { name: entity.name };
  const item = await db.entityWorkflowState.findFirst({
    where: {
      entity: entityFilter,
      name: stateName,
    },
    include: {
      fromStates: true,
      toStates: true,
    },
  });
  if (!item) {
    return null;
  }
  return item;
}

export async function createWorkflowState(data: {
  entityId: string;
  order: number;
  name: string;
  title: string;
  color: Colors;
  canUpdate: boolean;
  canDelete: boolean;
  emailSubject: string;
  emailBody: string;
}) {
  return await db.entityWorkflowState.create({
    data,
  });
}

export async function updateWorkflowState(
  id: string,
  data: {
    order?: number;
    name?: string;
    title?: string;
    color?: Colors;
    canUpdate?: boolean;
    canDelete?: boolean;
    emailSubject?: string;
    emailBody?: string;
  }
) {
  return await db.entityWorkflowState.update({
    where: { id },
    data,
  });
}

export async function deleteWorkflowState(id: string) {
  return await db.entityWorkflowState.delete({
    where: { id },
  });
}
