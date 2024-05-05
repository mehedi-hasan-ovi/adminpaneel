import { useTranslation } from "react-i18next";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { useActionData, useParams, useSubmit } from "@remix-run/react";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenant, getTenantBySlug, getTenantUsers, TenantWithDetails, updateTenant } from "~/utils/db/tenants.db.server";
import UpdateTenantDetailsForm from "~/components/core/tenants/UpdateTenantDetailsForm";
import { createAdminLog } from "~/utils/db/logs.db.server";
import UsersTable from "~/components/core/users/UsersTable";
import { adminGetAllTenantUsers, getUser } from "~/utils/db/users.db.server";
import {
  getOrPersistTenantSubscription,
  getTenantSubscription,
  TenantSubscriptionWithDetails,
  updateTenantSubscriptionCustomerId,
} from "~/utils/db/tenantSubscriptions.db.server";
import { getAllSubscriptionProducts } from "~/utils/db/subscriptionProducts.db.server";
import { createStripeCustomer } from "~/utils/stripe.server";
import { Fragment, useEffect, useRef } from "react";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import SuccessModal, { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { useAdminData } from "~/utils/data/useAdminData";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import { deleteAndCancelTenant } from "~/utils/services/tenantService";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { getUserInfo } from "~/utils/session.server";
import { createAccountDeletedEvent, createAccountUpdatedEvent } from "~/utils/services/events/accountsEventsService";
import { SubscriptionProductDto } from "~/application/dtos/subscriptions/SubscriptionProductDto";
import { useTypedLoaderData } from "remix-typedjson";
import { EntityWithDetails, findEntityByName } from "~/utils/db/entities/entities.db.server";
import { RowsApi } from "~/utils/api/RowsApi";
import { getAllTenantTypes } from "~/utils/db/tenants/tenantTypes.db.server";
import { TenantType } from "@prisma/client";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import SettingSection from "~/components/ui/sections/SettingSection";

type LoaderData = {
  title: string;
  tenant: TenantWithDetails;
  users: Awaited<ReturnType<typeof adminGetAllTenantUsers>>;
  subscription: TenantSubscriptionWithDetails | null;
  subscriptionProducts: SubscriptionProductDto[];
  isStripeTest: boolean;
  tenantSettingsEntity: EntityWithDetails | null;
  tenantTypes: TenantType[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  await verifyUserHasPermission(request, "admin.account.view");
  let { t } = await i18nHelper(request);

  const tenant = await getTenant(params.id!);
  if (!tenant) {
    return redirect("/admin/accounts");
  }
  const users = await adminGetAllTenantUsers(tenant.id);
  const subscription = await getTenantSubscription(params.id ?? "");
  const subscriptionProducts = await getAllSubscriptionProducts();

  const tenantSettingsEntity = await findEntityByName({ tenantId: null, name: "tenantSettings" });
  const data: LoaderData = {
    title: `${t("models.tenant.object")} | ${process.env.APP_NAME}`,
    tenant,
    users,
    subscription,
    subscriptionProducts,
    isStripeTest: process.env.STRIPE_SK?.toString().startsWith("sk_test_") ?? true,
    tenantSettingsEntity,
    tenantTypes: await getAllTenantTypes(),
  };
  return json(data);
};

type ActionData = {
  updateSubscriptionSuccess?: string;
  updateDetailsError?: string;
  updateSubscriptionError?: string;
};

const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const currentUser = await getUser(userInfo.userId);

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";

  const tenant = await getTenant(params.id ?? "");
  if (!tenant) {
    return redirect("/admin/accounts");
  }

  if (action === "edit") {
    const name = form.get("name")?.toString() ?? "";
    const slug = form.get("slug")?.toString().toLowerCase() ?? "";
    const icon = form.get("icon")?.toString() ?? "";
    const typeIds = form.getAll("typeIds[]").map((t) => t.toString());

    if ((name?.length ?? 0) < 2) {
      return badRequest({
        updateDetailsError: "Tenant name must have at least 2 characters",
      });
    }
    if (!slug || slug.length < 5) {
      return badRequest({
        updateDetailsError: "Tenant slug must have at least 5 characters",
      });
    }

    let tenantTypes = await getAllTenantTypes();
    typeIds.forEach((type) => {
      if (!tenantTypes.find((t) => t.id === type)) {
        return badRequest({
          updateDetailsError: "Invalid tenant type",
        });
      }
    });

    if (["settings"].includes(slug.toLowerCase())) {
      return badRequest({
        updateDetailsError: "Slug cannot be " + slug,
      });
    }
    if (slug.includes(" ")) {
      return badRequest({
        updateDetailsError: "Slug cannot contain white spaces",
      });
    }

    const existing = await getTenant(params.id!);
    if (!existing) {
      return badRequest({ updateDetailsError: "Invalid tenant" });
    }

    if (existing.slug !== slug) {
      const existingSlug = await getTenantBySlug(slug);
      if (existingSlug) {
        return badRequest({
          updateDetailsError: "Slug already taken",
        });
      }
    }
    await createAdminLog(request, "Update tenant details", JSON.stringify({ name, slug }));

    const tenantSettingsEntity = await findEntityByName({ tenantId: null, name: "tenantSettings" });
    if (tenantSettingsEntity) {
      try {
        await RowsApi.createCustom({
          entity: tenantSettingsEntity,
          tenantId: existing.id,
          t,
          form,
          row: existing?.tenantSettingsRow?.row,
          rowCreateInput: { tenantSettingsRow: { create: { tenantId: existing.id } } },
        });
      } catch (e: any) {
        return badRequest({ updateDetailsError: e.message });
      }
    }

    await createAccountUpdatedEvent(null, {
      id: tenant.id,
      new: { name, slug },
      old: { name: tenant.name, slug: tenant.slug },
      user: { id: currentUser?.id ?? "", email: currentUser?.email ?? "" },
    });
    await updateTenant({ name, icon, slug, typeIds }, params.id);
    return json({
      success: t("settings.tenant.updated"),
    });
  } else if (action === "create-stripe-customer") {
    if (!tenant) {
      return badRequest({ updateSubscriptionError: "Invalid tenant" });
    }
    const tenantUsers = await getTenantUsers(params.id ?? "");
    if (tenantUsers.length === 0) {
      return badRequest({ updateSubscriptionError: "No users found" });
    }
    const tenantOwner = tenantUsers.find((user) => user.type === TenantUserType.OWNER);
    if (!tenantOwner) {
      return badRequest({ updateSubscriptionError: "No owner found" });
    }
    const tenantSubscription = await getOrPersistTenantSubscription(tenant.id);
    if (tenantSubscription.stripeCustomerId) {
      return badRequest({ updateSubscriptionError: "Stripe Customer already set" });
    }
    const stripeCustomer = await createStripeCustomer(tenantOwner.user.email, tenant.name);
    if (!stripeCustomer) {
      return badRequest({ updateSubscriptionError: "Could not create stripe customer" });
    }
    await updateTenantSubscriptionCustomerId(tenant.id, {
      stripeCustomerId: stripeCustomer.id,
    });
    const data: ActionData = {
      updateSubscriptionSuccess: "Stripe customer created",
    };
    return json(data);
  } else if (action === "delete-tenant") {
    await createAccountDeletedEvent(tenant.id, userInfo.userId, t);
    await deleteAndCancelTenant(params.id ?? "");
    return redirect("/admin/accounts");
  } else {
    return badRequest({ updateDetailsError: t("shared.invalidForm") });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function TenantRoute() {
  const adminData = useAdminData();
  const params = useParams();
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();
  const submit = useSubmit();

  const errorModal = useRef<RefErrorModal>(null);
  const successModal = useRef<RefSuccessModal>(null);
  const confirmDelete = useRef<RefConfirmModal>(null);

  useEffect(() => {
    if (actionData?.updateSubscriptionSuccess) {
      successModal.current?.show(actionData?.updateSubscriptionSuccess);
    }
    if (actionData?.updateSubscriptionError) {
      errorModal.current?.show(actionData?.updateSubscriptionError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  function deleteAccount() {
    confirmDelete.current?.show(t("settings.danger.confirmDeleteTenant"), t("shared.confirm"), t("shared.cancel"), t("shared.warningCannotUndo"));
  }
  function confirmDeleteTenant() {
    const form = new FormData();
    form.set("action", "delete-tenant");
    submit(form, { method: "post" });
  }

  return (
    <EditPageLayout
      title={data.tenant.name}
      menu={[
        { title: t("models.tenant.plural"), routePath: "/admin/accounts" },
        { title: data.tenant?.name ?? "", routePath: "/admin/accounts/" + params.id },
      ]}
    >
      <SettingSection title={t("settings.tenant.general")} description={t("settings.tenant.generalDescription")}>
        <div className="mt-5 md:col-span-2 md:mt-0">
          <UpdateTenantDetailsForm
            tenant={data.tenant}
            actionData={actionData}
            disabled={!getUserHasPermission(adminData, "admin.account.settings.update")}
            tenantSettingsEntity={data.tenantSettingsEntity}
            tenantTypes={data.tenantTypes}
            options={{
              canChangeType: true,
            }}
          />
        </div>
      </SettingSection>

      {/*Separator */}
      <div className="block">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      {/* Tenant Users */}
      {getUserHasPermission(adminData, "admin.account.users") && (
        <Fragment>
          <SettingSection title={t("models.user.plural")}>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <UsersTable
                items={data.users}
                canImpersonate={getUserHasPermission(adminData, "admin.users.impersonate")}
                canChangePassword={getUserHasPermission(adminData, "admin.users.changePassword")}
                canSetUserRoles={false}
                canDelete={getUserHasPermission(adminData, "admin.users.delete")}
              />
            </div>
          </SettingSection>

          {/*Separator */}
          <div className="block">
            <div className="py-5">
              <div className="border-t border-gray-200"></div>
            </div>
          </div>
        </Fragment>
      )}

      {/* Tenant Subscription */}
      {/* {getUserHasPermission(adminData, "admin.account.subscription") && (
          <>
            <div className="md:grid lg:grid-cols-3 md:gap-2">
              <div className="md:col-span-1">
                <div className="sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">{t("models.subscriptionProduct.object")}</h3>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <UpdateTenantSubscriptionForm
                  tenant={data.tenant}
                  subscription={data.subscription}
                  subscriptionProducts={data.subscriptionProducts}
                  isStripeTest={data.isStripeTest}
                />
              </div>
            </div>

            <div className="block">
              <div className="py-5">
                <div className="border-t border-gray-200"></div>
              </div>
            </div>
          </>
        )} */}

      {/*Danger */}
      {getUserHasPermission(adminData, "admin.account.delete") && (
        <SettingSection title={t("settings.danger.title")} description={t("settings.danger.description")}>
          <div className="mt-12 md:col-span-2 md:mt-0">
            <div>
              <input hidden type="text" name="action" value="deleteAccount" readOnly />
              <div className="">
                <div className="">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Delete account</h3>
                  <div className="mt-2 max-w-xl text-sm leading-5 text-gray-500">
                    <p>Delete organization and cancel subscriptions.</p>
                  </div>
                  <div className="mt-4">
                    <ButtonPrimary destructive={true} onClick={deleteAccount}>
                      {t("settings.danger.deleteAccount")}
                    </ButtonPrimary>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>
      )}

      <ConfirmModal ref={confirmDelete} onYes={confirmDeleteTenant} />
      <SuccessModal ref={successModal} />
      <ErrorModal ref={errorModal} />
    </EditPageLayout>
  );
}
