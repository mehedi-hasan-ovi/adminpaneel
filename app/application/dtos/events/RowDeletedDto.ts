export type RowDeletedDto = {
  id: string;
  entity: { name: string; slug: string };
  folio: number;
  tenantId: string | null;
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    alias: string;
  };
};
