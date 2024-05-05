import { Tenant } from "@prisma/client";
import { TFunction } from "react-i18next";
import { AccountCreatedDto } from "~/application/dtos/events/AccountCreatedDto";
import { AccountDeletedDto } from "~/application/dtos/events/AccountDeletedDto";
import { AccountUpdatedDto } from "~/application/dtos/events/AccountUpdatedDto";
import { ApplicationEvent } from "~/application/dtos/shared/ApplicationEvent";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { getTenant } from "~/utils/db/tenants.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { baseURL } from "~/utils/url.server";
import { createApplicationEvent } from ".";

export async function createAccountCreatedEvent(tenantId: string, event: AccountCreatedDto) {
  await NotificationService.sendToRoles({
    channel: "admin-accounts",
    tenantId,
    notification: {
      message: `Account created: ${event.tenant.name}`,
      action: {
        title: "View account",
        url: `/admin/accounts/${event.tenant.id}`,
      },
    },
  });
  return await createApplicationEvent(ApplicationEvent.AccountCreated, tenantId, event, [baseURL + `/webhooks/events/accounts/created`]);
}

export async function createAccountUpdatedEvent(tenantId: string | null, event: AccountUpdatedDto) {
  return await createApplicationEvent(ApplicationEvent.AccountUpdated, tenantId, event, [process.env.SERVER_URL + `/webhooks/events/accounts/updated`]);
}

export async function createAccountsDeletedEvent(tenants: Tenant[], userId: string, t: TFunction) {
  return await Promise.all(
    tenants.map(async (tenant) => {
      return await createAccountDeletedEvent(tenant.id, userId, t);
    })
  );
}
export async function createAccountDeletedEvent(tenantId: string, userId: string, t: TFunction) {
  const tenant = await getTenant(tenantId);
  const user = await getUser(userId);
  // const tenantSubscription = await getTenantSubscription(tenantId);
  let subscription: any = undefined;
  // if (tenantSubscription?.subscriptionPrice) {
  //   subscription = {
  //     price: {
  //       id: tenantSubscription.subscriptionPriceId,
  //       amount: tenantSubscription.subscriptionPrice.price,
  //     },
  //     product: {
  //       id: tenantSubscription.subscriptionPrice.subscriptionProductId,
  //       title: t(tenantSubscription.subscriptionPrice.subscriptionProduct.title),
  //     },
  //   };
  // }
  const event: AccountDeletedDto = {
    tenant: { id: tenantId, name: tenant?.name ?? "", slug: tenant?.slug ?? "" },
    user: { id: user?.id ?? "", email: user?.email ?? "" },
    subscription,
  };
  await createApplicationEvent(ApplicationEvent.AccountDeleted, null, event, [process.env.SERVER_URL + `/webhooks/events/accounts/deleted`]);
  return event;
}
