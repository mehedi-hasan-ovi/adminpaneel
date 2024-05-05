export type RowUpdatedDto = {
  id: string;
  entity: { name: string; slug: string };
  folio: number;
  new: any;
  old: any;
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    alias: string;
  };
};
