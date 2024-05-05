export type RowSharedDto = {
  id: string;
  entityId: string;
  tenantId: string | null;
  folio: number;
  visibility: string;
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    alias: string;
  };
  permissions: {
    tenant: { id: string; name: string } | null;
    role: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
    user: { id: string; email: string } | null;
  }[];
};
