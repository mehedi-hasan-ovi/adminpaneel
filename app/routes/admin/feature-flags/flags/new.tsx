import { Role, Tenant } from "@prisma/client";
import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { redirect, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { groupUniqueVisitorsBy } from "~/modules/analytics/db/analyticsUniqueVisitors.db.server";
import FeatureFlagForm from "~/modules/featureFlags/components/FeatureFlagForm";
import { getFeatureFlag } from "~/modules/featureFlags/db/featureFlags.db.server";
import { FeatureFlagsFilterType } from "~/modules/featureFlags/dtos/FeatureFlagsFilterTypes";
import { db } from "~/utils/db.server";
import { getAllRoles } from "~/utils/db/permissions/roles.db.server";
import { getAllSubscriptionProducts } from "~/utils/db/subscriptionProducts.db.server";
import { adminGetAllTenants } from "~/utils/db/tenants.db.server";
import { UserSimple, adminGetAllUsers } from "~/utils/db/users.db.server";

type LoaderData = {
  metadata: {
    users: UserSimple[];
    tenants: Tenant[];
    subscriptionProducts: SubscriptionProductDto[];
    roles: Role[];
    analytics: {
      via: { name: string; count: number }[];
      httpReferrer: { name: string; count: number }[];
      browser: { name: string; count: number }[];
      os: { name: string; count: number }[];
      source: { name: string; count: number }[];
      medium: { name: string; count: number }[];
      campaign: { name: string; count: number }[];
    };
  };
};
export let loader = async ({ params }: LoaderArgs) => {
  const metadata = {
    users: (await adminGetAllUsers()).items,
    tenants: await adminGetAllTenants(),
    subscriptionProducts: await getAllSubscriptionProducts(),
    roles: await getAllRoles(),
    analytics: {
      via: await groupUniqueVisitorsBy("via"),
      httpReferrer: await groupUniqueVisitorsBy("httpReferrer"),
      browser: await groupUniqueVisitorsBy("browser"),
      os: await groupUniqueVisitorsBy("os"),
      source: await groupUniqueVisitorsBy("source"),
      medium: await groupUniqueVisitorsBy("medium"),
      campaign: await groupUniqueVisitorsBy("campaign"),
    },
  };
  const data: LoaderData = {
    metadata,
  };
  return json(data);
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action = async ({ request, params }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  if (action === "new") {
    const name = form.get("name")?.toString();
    const description = form.get("description")?.toString();

    const filters: { type: FeatureFlagsFilterType; value: string | null }[] = form.getAll("filters[]").map((f) => {
      return JSON.parse(f.toString());
    });

    if (!name || !description) {
      return json({ error: "Missing required fields." }, { status: 400 });
    }
    // if (filters.length === 0) {
    //   return json({ error: "Select at least one filter." }, { status: 400 });
    // }

    const existingFlag = await getFeatureFlag({ name, description });
    if (existingFlag) {
      return json({ error: "Flag with this name and description already exists." }, { status: 400 });
    }

    try {
      await db.featureFlag.create({
        data: {
          name,
          description,
          enabled: false,
          filters: {
            create: filters.map((f) => ({
              type: f.type.toString(),
              value: f.value ?? null,
            })),
          },
        },
      });
    } catch (e: any) {
      return json({ error: e.message }, { status: 400 });
    }

    return redirect("/admin/feature-flags/flags");
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedActionData<ActionData>();

  return (
    <div>
      <FeatureFlagForm item={undefined} metadata={data.metadata} />

      <ActionResultModal actionData={actionData ?? undefined} showSuccess={false} />
    </div>
  );
}
