export type LinkedAccountInvitationCreatedDto = {
  account: {
    name: string;
    email: string;
  };
  fromUser: {
    id: string;
    email: string;
  };
};
