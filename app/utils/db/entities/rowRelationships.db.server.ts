import { db } from "~/utils/db.server";

export async function getRowRelationship(id: string) {
  return await db.rowRelationship.findUnique({
    where: { id },
    include: {
      relationship: true,
    },
  });
}

export async function getRowsRelationship({ parentId, childId }: { parentId: string; childId: string }) {
  return await db.rowRelationship.findFirst({
    where: { parentId, childId },
  });
}

export async function createRowRelationship({ parentId, childId, relationshipId }: { parentId: string; childId: string; relationshipId: string }) {
  return await db.rowRelationship.create({
    data: {
      parentId,
      childId,
      relationshipId,
    },
  });
}

export async function deleteRowRelationship({ parentId, childId }: { parentId: string; childId: string }) {
  return await db.rowRelationship.deleteMany({
    where: {
      parentId,
      childId,
    },
  });
}

export async function deleteRowRelationshipById(id: string) {
  return await db.rowRelationship.delete({
    where: {
      id,
    },
  });
}
