export type RowTagsCreatedDto = {
  rowId: string;
  tag: {
    id: string;
    name: string;
    color: string;
  };
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    alias: string;
  };
};
