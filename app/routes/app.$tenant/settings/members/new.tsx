import { loadAppData } from "~/utils/data/useAppData";
import { ActionFunction, json, LoaderFunction, redirect, V2_MetaFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenantMember } from "~/utils/db/tenants.db.server";
import { getUserByEmail } from "~/utils/db/users.db.server";
import { createUserInvitation } from "~/utils/db/tenantUserInvitations.db.server";
import { sendEmail } from "~/utils/email.server";
import NewMember from "~/components/core/settings/members/NewMember";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { baseURL } from "~/utils/url.server";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import ServerError from "~/components/ui/errors/ServerError";

export type NewMemberLoaderData = {
  title: string;
  featurePlanUsage: PlanFeatureUsageDto | undefined;
};

export let loader: LoaderFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);
  await verifyUserHasPermission(request, "app.settings.members.create", tenantId);
  const featurePlanUsage = await getPlanFeatureUsage(tenantId, DefaultFeatures.Users);
  const data: NewMemberLoaderData = {
    title: `${t("settings.members.actions.new")} | ${process.env.APP_NAME}`,
    featurePlanUsage,
  };
  return json(data);
};

export type NewMemberActionData = {
  error?: string;
  success?: string;
  fields?: {
    email: string;
    firstName: string;
    lastName: string;
    role: number;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.settings.members.new");
  const tenantId = await getTenantIdFromUrl(params);

  const appData = await time(loadAppData({ request, params }, time), "loadAppData");

  const form = await request.formData();

  const email = form.get("email")?.toString().toLowerCase().trim() ?? "";
  const firstName = form.get("first-name")?.toString() ?? "";
  const lastName = form.get("last-name")?.toString() ?? "";
  const sendInvitationEmail = Boolean(form.get("send-invitation-email"));

  try {
    const user = await getUserByEmail(email);
    if (user) {
      const tenantUser = await getTenantMember(user.id, tenantId);
      if (tenantUser) {
        return json({ error: "User already in organization" }, { headers: getServerTimingHeader() });
      }
    }

    const invitation = await createUserInvitation(tenantId, {
      email,
      firstName,
      lastName,
      type: TenantUserType.MEMBER,
    });
    if (!invitation) {
      return json(
        {
          error: "Could not create invitation",
        },
        { headers: getServerTimingHeader() }
      );
    }

    if (sendInvitationEmail) {
      await sendEmail(email, "user-invitation", {
        name: firstName,
        invite_sender_name: appData.user?.firstName,
        invite_sender_organization: appData.currentTenant?.name,
        action_url: baseURL + `/invitation/${invitation.id}`,
      });
    }

    return redirect(`/app/${params.tenant}/settings/members`, { headers: getServerTimingHeader() });
  } catch (e: any) {
    return json({ error: e.error }, { headers: getServerTimingHeader() });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function NewMemberRoute() {
  const data = useTypedLoaderData<NewMemberLoaderData>();
  return <NewMember featurePlanUsage={data.featurePlanUsage} />;
}

export function ErrorBoundary() {
  return <ServerError />;
}
