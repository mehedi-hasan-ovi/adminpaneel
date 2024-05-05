export type MemberUpdatedDto = {
  new: {
    type: string;
  };
  old: {
    type: string;
  };
  user: { id: string; email: string };
  fromUser: {
    id: string;
    email: string;
  };
};
