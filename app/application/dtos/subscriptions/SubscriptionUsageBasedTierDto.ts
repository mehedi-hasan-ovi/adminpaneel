import { Decimal } from "@prisma/client/runtime/library";

export interface SubscriptionUsageBasedTierDto {
  id: string;
  subscriptionUsageBasedPriceId: string;
  from: number;
  to?: number | null;
  perUnitPrice?: number | Decimal | null;
  flatFeePrice?: number | Decimal | null;
}
