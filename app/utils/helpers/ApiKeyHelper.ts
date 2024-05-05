import { ApiKeyEntity, Entity } from "@prisma/client";
import { ApiKeyEntityPermissionDto } from "~/application/dtos/apiKeys/ApiKeyEntityPermissionDto";
import { getEntitiesInIds } from "../db/entities/entities.db.server";

export function getApiKeyCrudPermissions(c: boolean, r: boolean, u: boolean, d: boolean) {
  let permissions = "";
  if (c) {
    permissions += "C";
  }
  if (r) {
    permissions += "R";
  }
  if (u) {
    permissions += "U";
  }
  if (d) {
    permissions += "D";
  }
  return permissions;
}

export async function getApiKeyEntityPermissions(
  entities:
    | {
        entityId: string;
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
      }[]
    | (ApiKeyEntity & { entity: Entity })[]
): Promise<ApiKeyEntityPermissionDto[]> {
  const apiKeyEntities = await getEntitiesInIds(entities.map((f) => f.entityId));
  const entityPermissions: ApiKeyEntityPermissionDto[] = [];
  entities.forEach((apiKeyEntity) => {
    const entity = apiKeyEntities.find((f) => f.id === apiKeyEntity.entityId);
    entityPermissions.push({
      id: apiKeyEntity.entityId,
      name: entity?.name ?? "",
      create: apiKeyEntity.create,
      read: apiKeyEntity.read,
      update: apiKeyEntity.update,
      delete: apiKeyEntity.delete,
    });
  });
  return entityPermissions;
}

export function checkApiKeyCallIsCreditable(statusCode: number | null) {
  if (!statusCode) {
    return false;
  }
  if (apiKeyCreditableStatusCodes.includes(statusCode)) {
    return true;
  }
  return false;
}

export const apiKeyCreditableStatusCodes = [200, 201, 202, 203, 204, 205, 206, 207, 208, 226];
export const apiKeyIgnoreEndpoints = ["/api/usage"];
