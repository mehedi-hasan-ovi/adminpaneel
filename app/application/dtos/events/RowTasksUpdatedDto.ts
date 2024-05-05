export type RowTasksUpdatedDto = {
  rowId: string;
  new: {
    id: string;
    name: string;
    completedAt?: Date | null;
  };
  old: {
    id: string;
    name: string;
    completedAt?: Date | null;
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
