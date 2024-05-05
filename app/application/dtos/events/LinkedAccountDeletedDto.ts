export type LinkedAccountDeletedDto = {
  account: {
    id: string;
    name: string;
  };
  fromUser: {
    id: string;
    email: string;
  };
};
