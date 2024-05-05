export type AccountDeletedDto = {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
  };
  subscription?: {
    price: {
      id: string;
      amount: number;
    };
    product: {
      id: string;
      title: string;
    };
  };
};
