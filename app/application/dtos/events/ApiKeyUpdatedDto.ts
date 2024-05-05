import { ApiKeyEntityPermissionDto } from "../apiKeys/ApiKeyEntityPermissionDto";

export type ApiKeyUpdatedDto = {
  id: string;
  new: {
    alias: string;
    expires: Date | null;
    active: boolean;
    entities: ApiKeyEntityPermissionDto[];
  };
  old: {
    alias: string;
    expires: Date | null;
    active: boolean;
    entities: ApiKeyEntityPermissionDto[];
  };
  user: {
    id: string;
    email: string;
  };
};
