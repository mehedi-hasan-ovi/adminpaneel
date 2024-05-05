import { SubscriptionFeatureLimitType } from "~/application/enums/subscriptions/SubscriptionFeatureLimitType";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";

export interface PlanFeatureUsageDto {
  order: number;
  title: string;
  name: string;
  type: SubscriptionFeatureLimitType;
  value: number;
  used: number;
  remaining: number | "unlimited";
  enabled: boolean;
  message: string;
  entity?: EntityWithDetails;
  period?: {
    firstDay: Date | null;
    lastDay: Date | null;
  };
}
