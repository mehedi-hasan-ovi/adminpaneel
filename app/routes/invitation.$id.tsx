import Logo from "~/components/brand/Logo";
import LoadingButton, { RefLoadingButton } from "~/components/ui/buttons/LoadingButton";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import UserUtils from "~/utils/app/UserUtils";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getUserByEmail, register } from "~/utils/db/users.db.server";
import { sendEmail } from "~/utils/email.server";
import { getUserInvitation, updateUserInvitationPending } from "~/utils/db/tenantUserInvitations.db.server";
import { createTenantUser, getTenant } from "~/utils/db/tenants.db.server";
import { createUserSession, getUserInfo, setLoggedUser } from "~/utils/session.server";
import { TenantUserInvitation, Tenant, User } from "@prisma/client";
import { Language } from "remix-i18next";
import { getAllRoles } from "~/utils/db/permissions/roles.db.server";
import { createMemberInvitationAcceptedEvent } from "~/utils/services/events/membersEventsService";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { baseURL } from "~/utils/url.server";

type LoaderData = {
  title: string;
  i18n: Record<string, Language>;
  invitation: (TenantUserInvitation & { tenant: Tenant }) | null;
  existingUser: User | null;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  let { t, translations } = await i18nHelper(request);

  const invitation = await getUserInvitation(params.id ?? "");
  const existingUser = await getUserByEmail(invitation?.email);
  const data: LoaderData = {
    title: `${t("account.invitation.title")} | ${process.env.APP_NAME}`,
    i18n: translations,
    invitation,
    existingUser,
  };
  return json(data);
};

type ActionData = {
  success?: string;
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const form = await request.formData();
  const password = form.get("password")?.toString() ?? "";
  const passwordConfirm = form.get("password-confirm")?.toString() ?? "";

  const invitation = await getUserInvitation(params.id ?? "");
  if (!invitation) {
    return badRequest({
      error: "Invalid invitation",
    });
  }

  let existingUser = await getUserByEmail(invitation.email);
  if (!existingUser) {
    // Register user
    const passwordError = UserUtils.validatePasswords({ t, password, passwordConfirm });
    if (passwordError) {
      return badRequest({ error: passwordError });
    }

    const user = await register({ email: invitation.email, password, firstName: invitation.firstName, lastName: invitation.lastName, locale: userInfo.lng });
    if (!user) {
      return badRequest({ error: "Could not create user" });
    }
    await updateUserInvitationPending(invitation.id);
    const roles = await getAllRoles("app");
    await createTenantUser(
      {
        tenantId: invitation.tenantId,
        userId: user.id,
        type: invitation.type,
      },
      roles.filter((f) => f.assignToNewUsers)
    );
    await createMemberInvitationAcceptedEvent(invitation.tenantId, {
      newUser: true,
      user: { id: user.id, email: user.email, firstName: invitation.firstName, lastName: invitation.lastName, type: TenantUserType[invitation.type] },
      invitation: { id: invitation.id },
    });

    await sendEmail(invitation.email, "welcome", {
      action_url: baseURL + `/login`,
      name: invitation.firstName,
    });

    const userSession = await setLoggedUser(user);
    const tenant = await getTenant(userSession.defaultTenantId);
    return createUserSession(
      {
        ...userInfo,
        ...userSession,
        userId: user.id,
        lng: user.locale ?? userInfo.lng,
      },
      tenant ? `/app/${tenant.slug ?? tenant.id}/dashboard` : "/app"
    );
  } else {
    // Existing user
    await updateUserInvitationPending(invitation.id);
    const roles = await getAllRoles("app");
    await createTenantUser(
      {
        tenantId: invitation.tenantId,
        userId: existingUser.id,
        type: invitation.type,
      },
      roles.filter((f) => f.assignToNewUsers)
    );
    await createMemberInvitationAcceptedEvent(invitation.tenantId, {
      newUser: false,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        type: TenantUserType[invitation.type],
      },
      invitation: { id: invitation.id },
    });

    const userSession = await setLoggedUser(existingUser);
    const tenant = await getTenant(userSession.defaultTenantId);
    return createUserSession(
      {
        ...userInfo,
        ...userSession,
        lng: existingUser?.locale ?? userInfo.lng,
      },
      tenant ? `/app/${tenant.slug ?? tenant.id}/dashboard` : "/app"
    );
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function InvitationRoute() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();

  const loadingButton = useRef<RefLoadingButton>(null);
  const errorModal = useRef<RefErrorModal>(null);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  return (
    <div>
      <div>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Logo className="mx-auto h-12 w-auto" />
          </div>
          {(() => {
            if (!data.invitation) {
              return <div className="text-center text-red-500">{t("shared.invalidInvitation")}</div>;
            } else {
              return (
                <div>
                  <h2 className="mt-6 text-center text-lg font-extrabold text-gray-800 dark:text-slate-200">
                    {t("shared.hi")} {data.invitation.firstName ? data.invitation.firstName : data.invitation.email}, {t("account.invitation.youWereInvited")}{" "}
                    {data.invitation.tenant.name}
                  </h2>
                  <p className="max-w mt-2 text-center text-sm leading-5 text-gray-500">
                    {t("account.register.alreadyRegistered")}{" "}
                    <span className="font-medium text-theme-500 transition duration-150 ease-in-out hover:text-theme-400 focus:underline focus:outline-none">
                      <Link to="/login">{t("account.register.clickHereToLogin")}</Link>
                    </span>
                  </p>

                  <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="px-4 py-8 sm:rounded-sm sm:px-10">
                      <Form method="post" className="sm:w-96">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium leading-5">
                            {t("account.shared.email")}
                          </label>
                          <div className="mt-1 rounded-sm shadow-sm">
                            <input
                              disabled={true}
                              type="email"
                              id="email"
                              name="email"
                              defaultValue={data.invitation.email}
                              required
                              className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
                            />
                          </div>
                        </div>
                        {!data.existingUser && (
                          <>
                            <div className="mt-6">
                              <label htmlFor="password" className="block text-sm font-medium leading-5">
                                {t("account.shared.password")}
                              </label>
                              <div className="mt-1 rounded-sm shadow-sm">
                                <input
                                  type="password"
                                  id="password"
                                  name="password"
                                  required
                                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-6">
                              <label htmlFor="password-confirm" className="block text-sm font-medium leading-5">
                                {t("account.register.confirmPassword")}
                              </label>
                              <div className="mt-1 rounded-sm shadow-sm">
                                <input
                                  type="password"
                                  id="password-confirm"
                                  name="password-confirm"
                                  required
                                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-500 focus:outline-none focus:ring-theme-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="mt-6">
                          <span className="block w-full rounded-sm shadow-sm">
                            <LoadingButton className="block w-full" type="submit" ref={loadingButton}>
                              {t("account.invitation.button")}
                            </LoadingButton>
                          </span>
                        </div>
                      </Form>
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </div>
        <ErrorModal ref={errorModal} />
      </div>
    </div>
  );
}
