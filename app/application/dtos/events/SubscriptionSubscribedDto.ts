export type SubscriptionSubscribedDto = {
  user: {
    id: string;
    email: string;
  };
  subscription: {
    product: {
      id: string;
      title: string;
    };
    session?: string;
  };
};
