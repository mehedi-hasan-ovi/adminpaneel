import { ActionFunction, json } from "@remix-run/node";
import { SubscriptionDowngradedDto } from "~/application/dtos/events/SubscriptionDowngradedDto";
import { i18nHelper } from "~/locale/i18n.utils";
import SubscriptionUtils from "~/utils/app/SubscriptionUtils";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      const { t } = await i18nHelper(request);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as SubscriptionDowngradedDto;
      // do something with the body 😉
      const toBillingPeriodName = SubscriptionUtils.getBillingPeriodDescription(t, body.to.price.billingPeriod);
      const fromBillingPeriodName = SubscriptionUtils.getBillingPeriodDescription(t, body.from.price.billingPeriod);
      return json(
        {
          message: `Downgraded to ${body.to.product.title} - $${body.to.price.amount} (${toBillingPeriodName}) from ${body.from.product.title} - $${body.from.price.amount} (${fromBillingPeriodName}).`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
