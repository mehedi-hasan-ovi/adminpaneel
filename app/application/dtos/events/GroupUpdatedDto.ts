export type GroupUpdatedDto = {
  id: string;
  new: {
    name: string;
    description: string;
    color: string;
    members: {
      id: string;
      email: string;
    }[];
  };
  old: {
    name: string;
    description: string;
    color: string;
    members: {
      id: string;
      email: string;
    }[];
  };
  user: {
    id: string;
    email: string;
  };
};
