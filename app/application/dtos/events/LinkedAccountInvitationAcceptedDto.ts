export type LinkedAccountInvitationAcceptedDto = {
  account: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
  };
};
