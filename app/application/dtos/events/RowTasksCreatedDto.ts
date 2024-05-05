export type RowTasksCreatedDto = {
  rowId: string;
  task: {
    id: string;
    name: string;
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
