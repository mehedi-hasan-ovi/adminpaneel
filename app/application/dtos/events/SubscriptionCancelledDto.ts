export type SubscriptionCancelledDto = {
  user: {
    id: string;
    email: string;
  };
  subscription?: {
    product: {
      id: string;
      title: string;
    };
  };
};
