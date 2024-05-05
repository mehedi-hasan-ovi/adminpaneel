export type GroupCreatedDto = {
  id: string;
  name: string;
  description: string;
  color: string;
  members: {
    id: string;
    email: string;
  }[];
  user: {
    id: string;
    email: string;
  };
};
