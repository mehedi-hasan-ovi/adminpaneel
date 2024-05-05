export type RowCreatedDto = {
  entity: { id: string; name: string; slug: string };
  folio: number;
  tenantId: string | null;
  visibility: string;
  id: string;
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    alias: string;
  };
};
