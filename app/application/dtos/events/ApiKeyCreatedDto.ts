import { ApiKeyEntityPermissionDto } from "../apiKeys/ApiKeyEntityPermissionDto";

export type ApiKeyCreatedDto = {
  id: string;
  alias: string;
  expires: Date | null;
  active: boolean;
  entities: ApiKeyEntityPermissionDto[];
  user: {
    id: string;
    email: string;
  };
};
