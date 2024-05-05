export type MemberDeletedDto = {
  user: {
    id: string;
    email: string;
    type: string;
  };
  fromUser: {
    id: string;
    email: string;
  };
};
