import { createRowRelationship, deleteRowRelationship, deleteRowRelationshipById, getRowRelationship } from "../db/entities/rowRelationships.db.server";
import { getEntitiesRelationship } from "../db/entities/entityRelationships.db.server";
import { TimeFunction, timeFake } from "~/modules/metrics/utils/MetricTracker";
import { RowsApi } from "./RowsApi";
import { EntityWithDetails, EntityWithDetailsAndRelationships, getEntityById } from "../db/entities/entities.db.server";

export namespace RowRelationshipsApi {
  export async function getRelationship(
    id: string,
    {
      tenantId,
      userId,
      time,
    }: {
      userId: string | undefined;
      tenantId: string | null;
      time?: TimeFunction;
    }
  ) {
    if (!time) {
      time = timeFake;
    }
    const relationship = await time(getRowRelationship(id), "RowRelationshipsApi.getRelationship");
    if (!relationship) {
      return null;
    }
    const parent = await RowsApi.get(relationship.parentId, {
      entity: {
        id: relationship.relationship.parentId,
      },
      tenantId,
      userId,
    });
    const child = await RowsApi.get(relationship.childId, {
      entity: {
        id: relationship.relationship.childId,
      },
      tenantId,
      userId,
    });
    return {
      ...relationship,
      parent,
      child,
    };
  }
  export async function createRelationship({
    parent,
    child,
    time,
    allEntities,
  }: {
    parent: { id: string; entityId: string };
    child: { id: string; entityId: string };
    time?: TimeFunction;
    allEntities?: EntityWithDetails[];
  }) {
    if (!time) {
      time = timeFake;
    }
    let parentEntity: EntityWithDetailsAndRelationships | null = null;
    let childEntity: EntityWithDetailsAndRelationships | null = null;
    if (allEntities) {
      parentEntity = allEntities.find((e) => e.id === parent.entityId) || null;
      childEntity = allEntities.find((e) => e.id === child.entityId) || null;
    } else {
      parentEntity = await getEntityById({ tenantId: undefined, id: parent.entityId });
      childEntity = await getEntityById({ tenantId: undefined, id: child.entityId });
    }
    if (!parentEntity) {
      throw Error(`Invalid parent entity id ${parent.entityId}`);
    } else if (!childEntity) {
      throw Error(`Invalid child entity id ${child.entityId}`);
    }
    const relationship = parentEntity.childEntities.find((e) => e.childId === child.entityId);
    if (!relationship) {
      throw Error(`No relationship found between ${parentEntity?.name} and ${childEntity?.name}`);
    }
    return await time(
      createRowRelationship({
        relationshipId: relationship.id,
        parentId: parent.id,
        childId: child.id,
      }),
      "RowRelationshipsApi.createRelationship.createRowRelationship"
    );
  }
  export async function createRelationshipWithIds({
    parentEntityId,
    childEntityId,
    parentId,
    childId,
    time,
    allEntities,
  }: {
    parentEntityId: string;
    childEntityId: string;
    parentId: string;
    childId: string;

    time?: TimeFunction;
    allEntities?: EntityWithDetails[];
  }) {
    if (!time) {
      time = timeFake;
    }
    let parentEntity: EntityWithDetailsAndRelationships | null = null;
    let childEntity: EntityWithDetailsAndRelationships | null = null;
    if (allEntities) {
      parentEntity = allEntities.find((e) => e.id === parentEntityId) || null;
      childEntity = allEntities.find((e) => e.id === childEntityId) || null;
    } else {
      parentEntity = await getEntityById({ tenantId: undefined, id: parentEntityId });
      childEntity = await getEntityById({ tenantId: undefined, id: childEntityId });
    }
    if (!parentEntity) {
      throw Error(`Invalid parent entity id ${parentEntityId}`);
    } else if (!childEntity) {
      throw Error(`Invalid child entity id ${childEntityId}`);
    }
    const relationship = parentEntity.childEntities.find((e) => e.childId === childEntityId);
    if (!relationship) {
      throw Error(`No relationship found between ${parentEntity?.name} and ${childEntity?.name}`);
    }
    return await time(
      createRowRelationship({
        relationshipId: relationship.id,
        parentId: parentId,
        childId: childId,
      }),
      "RowRelationshipsApi.createRelationship.createRowRelationship"
    );
  }
  export async function deleteRelationship({
    parent,
    child,
    time,
  }: {
    parent: { id: string; entityId: string };
    child: { id: string; entityId: string };
    time?: TimeFunction;
  }) {
    if (!time) {
      time = timeFake;
    }
    const relationship = await time(
      getEntitiesRelationship({
        parentEntityId: parent.entityId,
        childEntityId: child.entityId,
      }),
      "RowRelationshipsApi.deleteRelationship.getEntitiesRelationship"
    );
    if (!relationship) {
      throw Error(`No relationship found between ${parent.entityId} and ${child.entityId}`);
    }
    return await time(
      deleteRowRelationship({
        parentId: parent.id,
        childId: child.id,
      }),
      "RowRelationshipsApi.deleteRelationship.deleteRowRelationship"
    );
  }
  export async function deleteRelationshipById(
    id: string,
    {
      tenantId,
      userId,
      time,
    }: {
      tenantId: string | null;
      userId: string | undefined;
      time?: TimeFunction;
    }
  ) {
    if (!time) {
      time = timeFake;
    }
    const relationship = await getRelationship(id, { tenantId, userId, time });
    if (!relationship) {
      throw Error(`No relationship found with id ${id}`);
    }
    return await time(deleteRowRelationshipById(id), "RowRelationshipsApi.deleteRelationship.deleteRowRelationship");
  }
}
