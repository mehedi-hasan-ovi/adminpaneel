export type MemberInvitationAcceptedDto = {
  newUser: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    type: string;
  };
  invitation: {
    id: string;
  };
};
