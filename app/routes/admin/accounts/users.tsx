import { useTranslation } from "react-i18next";
import { ActionArgs, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { adminGetAllUsers, getUser, updateUserPassword, UserWithDetails } from "~/utils/db/users.db.server";
import { createUserSession, getUserInfo, setLoggedUser } from "~/utils/session.server";
import { i18nHelper } from "~/locale/i18n.utils";
import bcrypt from "bcryptjs";
import UsersTable from "~/components/core/users/UsersTable";
import { deleteUserWithItsTenants } from "~/utils/services/userService";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { useAdminData } from "~/utils/data/useAdminData";
import InputFilters from "~/components/ui/input/InputFilters";
import { getFiltersFromCurrentUrl, getPaginationFromCurrentUrl } from "~/utils/helpers/RowPaginationHelper";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { createAccountsDeletedEvent } from "~/utils/services/events/accountsEventsService";
import { createUserPasswordUpdatedEvent, createUserProfileDeletedEvent } from "~/utils/services/events/usersEventsService";
import { adminGetAllTenantsIdsAndNames, getTenant } from "~/utils/db/tenants.db.server";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { Log } from "@prisma/client";
import { getLastUserLog } from "~/utils/db/logs.db.server";
import { useTypedLoaderData } from "remix-typedjson";
import { useNavigate, useOutlet } from "@remix-run/react";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
export { serverTimingHeaders as headers };

type LoaderData = {
  title: string;
  items: UserWithDetails[];
  filterableProperties: FilterablePropertyDto[];
  pagination: PaginationDto;
  lastLogs: { userId: string; log: Log }[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "admin.users");
  await time(verifyUserHasPermission(request, "admin.users.view"), "verifyUserHasPermission");
  let { t } = await time(i18nHelper(request), "i18nHelper");

  const filterableProperties: FilterablePropertyDto[] = [
    { name: "email", title: "models.user.email" },
    { name: "firstName", title: "models.user.firstName" },
    { name: "lastName", title: "models.user.lastName" },
    {
      name: "tenantId",
      title: "models.tenant.object",
      manual: true,
      options: (await adminGetAllTenantsIdsAndNames()).map((tenant) => {
        return {
          value: tenant.id,
          name: tenant.name,
        };
      }),
    },
    {
      name: "lastLogin",
      title: "Has logged in",
      manual: true,
      options: [
        {
          value: "last-24-hours", // days
          name: t("app.shared.periods.LAST_24_HOURS"),
        },
        {
          value: "last-7-days", // days
          name: t("app.shared.periods.LAST_WEEK"),
        },
        {
          value: "last-30-days", // days
          name: t("app.shared.periods.LAST_30_DAYS"),
        },
        {
          value: "last-3-months", // months
          name: t("app.shared.periods.LAST_3_MONTHS"),
        },
        {
          value: "last-6-months", // months
          name: t("app.shared.periods.LAST_N_MONTHS", [6]),
        },
        {
          value: "last-year", // months
          name: t("app.shared.periods.LAST_YEAR"),
        },
      ],
    },
    {
      name: "isAdmin",
      title: "Is admin",
      manual: true,
      isBoolean: true,
      hideSearch: true,
    },
  ];
  const filters = getFiltersFromCurrentUrl(request, filterableProperties);
  const urlSearchParams = new URL(request.url).searchParams;
  const currentPagination = getPaginationFromCurrentUrl(urlSearchParams);
  const { items, pagination } = await time(adminGetAllUsers(filters, currentPagination), "adminGetAllUsers");

  const lastLogs = (
    await time(
      Promise.all(
        items.map(async (user) => {
          const log = await getLastUserLog(user.id);
          return log ? { userId: user.id, log } : null;
        })
      ),
      "getLastUserLog"
    )
  )
    .filter((entry) => entry !== null)
    .map((entry) => entry as { userId: string; log: Log });

  const data: LoaderData = {
    title: `${t("models.user.plural")} | ${process.env.APP_NAME}`,
    items,
    filterableProperties,
    pagination,
    lastLogs,
  };
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

type ActionData = {
  error?: string;
  success?: string;
};
const success = (data: ActionData) => json(data, { status: 200 });
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action = async ({ request }: ActionArgs) => {
  const userInfo = await getUserInfo(request);
  let { t } = await i18nHelper(request);

  const form = await request.formData();
  const action = form.get("action")?.toString();
  const userId = form.get("user-id")?.toString();
  const user = await getUser(userId);

  if (!userId || !user || !action) {
    return badRequest({ error: "Form not submitted correctly." });
  }
  switch (action) {
    case "impersonate": {
      const userSession = await setLoggedUser(user);
      if (!userSession) {
        return badRequest({
          error: t("shared.notFound"),
        });
      }
      const tenant = await getTenant(userSession.defaultTenantId);
      return createUserSession(
        {
          ...userInfo,
          ...userSession,
          impersonatingFromUserId: userInfo.userId,
        },
        tenant ? `/app/${tenant.slug ?? tenant.id}/dashboard` : "/app"
      );
    }
    case "change-password": {
      const passwordNew = form.get("password-new")?.toString();
      if (!passwordNew || passwordNew.length < 8) {
        return badRequest({ error: "Set a password with 8 characters minimum" });
      } else if (user?.admin) {
        return badRequest({ error: "You cannot change password for admin user" });
      }

      const passwordHash = await bcrypt.hash(passwordNew, 10);
      await updateUserPassword({ passwordHash }, user?.id);
      const currentUser = await getUser(userInfo.userId);
      await createUserPasswordUpdatedEvent(null, {
        user: { id: user.id, email: user.email },
        fromUser: { id: currentUser?.id ?? "", email: currentUser?.email ?? "" },
      });

      return success({ success: t("shared.updated") });
    }
    case "delete-user": {
      // TODO: CANCEL TENANTS SUBSCRIPTIONS, DELETE TENANTS AND SUBSCRIPTIONS
      try {
        const { deletedTenants } = await deleteUserWithItsTenants(userId);
        const deletedAccounts = await createAccountsDeletedEvent(deletedTenants, user.id, t);
        await createUserProfileDeletedEvent(null, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          deletedAccounts,
        });
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error(e);
        return badRequest({
          error: e,
        });
      }
      return success({ success: t("shared.deleted") });
    }
    default: {
      return badRequest({ error: "Form not submitted correctly." });
    }
  }
};

export default function AdminUsersRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const adminData = useAdminData();
  const outlet = useOutlet();
  const navigate = useNavigate();

  return (
    <EditPageLayout
      title={t("models.user.plural")}
      buttons={
        <>
          <InputFilters filters={data.filterableProperties} />
          <ButtonPrimary to="new">
            <span className="sm:text-sm">+</span>
          </ButtonPrimary>
        </>
      }
    >
      <UsersTable
        items={data.items}
        canImpersonate={getUserHasPermission(adminData, "admin.users.impersonate")}
        canChangePassword={getUserHasPermission(adminData, "admin.users.changePassword")}
        canDelete={getUserHasPermission(adminData, "admin.users.delete")}
        canSetUserRoles={adminData.isSuperAdmin}
        pagination={data.pagination}
        lastLogs={data.lastLogs}
      />

      <SlideOverWideEmpty
        open={!!outlet}
        onClose={() => {
          navigate(".", { replace: true });
        }}
        className="sm:max-w-sm"
        overflowYScroll={true}
      >
        <div className="-mx-1 -mt-3">
          <div className="space-y-4">{outlet}</div>
        </div>
      </SlideOverWideEmpty>
    </EditPageLayout>
  );
}
