export type LinkedAccountInvitationRejectedDto = {
  account: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
  };
};
