export type MemberInvitationCreatedDto = {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    type: string;
  };
  fromUser: {
    id: string;
    email: string;
  };
};
