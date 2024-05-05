import { SubscriptionBillingPeriod } from "~/application/enums/subscriptions/SubscriptionBillingPeriod";

export type SubscriptionDowngradedDto = {
  user: {
    id: string;
    email: string;
  };
  to: {
    price: {
      id: string;
      billingPeriod: SubscriptionBillingPeriod;
      amount: number;
    };
    product: {
      id: string;
      title: string;
    };
  };
  from: {
    price: {
      id: string;
      billingPeriod: SubscriptionBillingPeriod;
      amount: number;
    };
    product: {
      id: string;
      title: string;
    };
  };
};
