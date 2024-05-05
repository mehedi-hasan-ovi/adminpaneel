import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUserInfo } from "~/utils/session.server";
import { getUser, getUserByEmail, UserSimple } from "~/utils/db/users.db.server";
import { getMyTenants, TenantSimple } from "~/utils/db/tenants.db.server";
import { sendEmail } from "~/utils/email.server";
import { loadAppData } from "~/utils/data/useAppData";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import { createLog } from "~/utils/db/logs.db.server";
import NewLinkedAccount from "~/components/app/linkedAccounts/NewLinkedAccount";
import { LinkedAccountStatus } from "~/application/enums/tenants/LinkedAccountStatus";
import { createLinkedAccount, getLinkedAccountByTenantIds, getLinkedAccountsCount } from "~/utils/db/linkedAccounts.db.server";
import { LinkedAccount } from "@prisma/client";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { createLinkedAccountInvitationCreatedEvent } from "~/utils/services/events/linkedAccountsEventsService";
import { baseURL } from "~/utils/url.server";
import { getPlanFeatureUsage } from "~/utils/services/subscriptionService";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";

type LoaderData = {
  title: string;
  linksCount: number;
  featurePlanUsage: PlanFeatureUsageDto | undefined;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.settings.linked-accounts");
  let { t } = await time(i18nHelper(request), "i18nHelper");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  await verifyUserHasPermission(request, "app.settings.linkedAccounts.create", tenantId);

  const data: LoaderData = {
    title: `${t("app.linkedAccounts.actions.new")} | ${process.env.APP_NAME}`,
    linksCount: await time(getLinkedAccountsCount(tenantId, [LinkedAccountStatus.PENDING, LinkedAccountStatus.LINKED]), "getLinkedAccountsCount"),
    featurePlanUsage: await time(getPlanFeatureUsage(tenantId, DefaultFeatures.LinkedAccounts), "getPlanFeatureUsage"),
  };
  return json(data, { headers: getServerTimingHeader() });
};

export type NewLinkedAccountActionData = {
  error?: string;
  success?: string;
  linkedAccount?: LinkedAccount;
  findUserAccounts?: {
    user: UserSimple;
    tenants: TenantSimple[];
  };
};
const badRequest = (data: NewLinkedAccountActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.settings.linked-accounts.new");
  let { t } = await i18nHelper(request);
  const tenantId = await getTenantIdFromUrl(params);

  const userInfo = await getUserInfo(request);
  const currentUser = await getUser(userInfo.userId);

  const appData = await time(loadAppData({ request, params }, time), "loadAppData");

  const form = await request.formData();
  const action = form.get("action")?.toString();
  if (action === "get-accounts") {
    const email = form.get("email")?.toString().toLowerCase().trim() ?? "";
    const user = await getUserByEmail(email);
    if (!user) {
      return badRequest({ error: t("api.errors.userNotRegistered") });
    }
    const tenants = await getMyTenants(user.id);
    if (tenants.length === 0) {
      return badRequest({ error: t("app.linkedAccounts.invitation.inviteOwnersOrAdmins") });
    }
    const data: NewLinkedAccountActionData = {
      findUserAccounts: {
        user,
        tenants,
      },
    };
    return json(data, { headers: getServerTimingHeader() });
  } else if (action === "invite") {
    const email = form.get("email")?.toString().toLowerCase().trim() ?? "";
    const selectedTenantId = form.get("selected-tenant-id")?.toString() ?? "";
    const inviteeIsProvider = Boolean(form.get("invitee-is-provider"));
    if (!email || !tenantId) {
      return badRequest({ error: t("shared.missingFields") });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return badRequest({ error: t("api.errors.userNotRegistered") });
    }
    if (user.id === userInfo.userId) {
      return badRequest({ error: t("app.linkedAccounts.invitation.cannotInviteSelf") });
    }

    const tenants = await getMyTenants(user.id);
    const tenant = tenants.find((f) => f.id === selectedTenantId);
    if (!tenant) {
      return badRequest({
        error: t("app.linkedAccounts.invitation.notFound", [email]),
      });
    }
    if (tenant.id === tenantId) {
      return badRequest({ error: t("app.linkedAccounts.invitation.cannotInviteCurrentTenant") });
    }

    const providerTenantId = inviteeIsProvider ? tenant.id : tenantId;
    const clientTenantId = !inviteeIsProvider ? tenant.id : tenantId;
    const existing = await getLinkedAccountByTenantIds(providerTenantId, clientTenantId);
    if (existing) {
      return badRequest({ error: t("app.linkedAccounts.invitation.existing") });
    }

    const linkedAccount = await createLinkedAccount({
      createdByUserId: userInfo.userId,
      createdByTenantId: tenantId,
      providerTenantId,
      clientTenantId,
      status: LinkedAccountStatus.PENDING,
      // userInvitedId: user.id,
    });

    if (!linkedAccount) {
      return badRequest({ error: "Could not create link" });
    }

    await createLog(request, tenantId, "Created tenant relationship", `${tenant.name} ${inviteeIsProvider ? "as a provider" : "as a client"}`);

    try {
      await sendEmail(user.email, "create-linked-account", {
        action_url: baseURL + `/app/${tenant.slug}/settings/linked-accounts`,
        name: user.firstName,
        invite_sender_name: appData.user?.firstName,
        invite_sender_email: appData.user?.email,
        tenant_invitee: tenant.name,
        tenant_creator: appData.currentTenant?.name,
        invitation_role: inviteeIsProvider ? "as a provider" : "as a client",
      });
    } catch (e) {
      return badRequest({ error: "Link created, but could not send email: " + e });
    }

    await createLinkedAccountInvitationCreatedEvent(tenantId, {
      account: { name: tenant.name, email: user.email },
      fromUser: { id: currentUser?.id ?? "", email: currentUser?.email ?? "" },
    });
    const data: NewLinkedAccountActionData = {
      linkedAccount,
      success: t("app.linkedAccounts.pending.invitationSentDescription", [email]),
    };
    return json(data, { headers: getServerTimingHeader() });
  } else {
    return badRequest({ error: t("shared.invalidForm") });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function NewLinkedAccountRoute() {
  const data = useTypedLoaderData<LoaderData>();
  return <NewLinkedAccount linksCount={data.linksCount} featurePlanUsage={data.featurePlanUsage} />;
}
