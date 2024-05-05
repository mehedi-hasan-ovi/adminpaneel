import { useTranslation } from "react-i18next";
import { ActionFunction, json, LoaderFunction, V2_MetaFunction, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { useAppData } from "~/utils/data/useAppData";
import { i18nHelper } from "~/locale/i18n.utils";
import { getTenant, getTenantBySlug, updateTenant } from "~/utils/db/tenants.db.server";
import { getTenantIdFromUrl } from "~/utils/services/urlService";
import UpdateTenantDetailsForm from "~/components/core/tenants/UpdateTenantDetailsForm";
import { createLog } from "~/utils/db/logs.db.server";
import { getUserHasPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import { useEffect, useRef, useState } from "react";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { deleteAndCancelTenant } from "~/utils/services/tenantService";
import { createAccountDeletedEvent, createAccountUpdatedEvent } from "~/utils/services/events/accountsEventsService";
import { getUser } from "~/utils/db/users.db.server";
import { getUserInfo } from "~/utils/session.server";
import { getActiveTenantSubscriptions } from "~/utils/services/subscriptionService";
import OpenErrorModal from "~/components/ui/modals/OpenErrorModal";
import { useTypedLoaderData } from "remix-typedjson";
import { RowsApi } from "~/utils/api/RowsApi";
import { EntityWithDetails, findEntityByName } from "~/utils/db/entities/entities.db.server";
import { TenantWithDetails } from "~/utils/db/tenants.db.server";
import { storeSupabaseFile } from "~/utils/integrations/supabaseService";
import { TenantType } from "@prisma/client";
import { getAllTenantTypes } from "~/utils/db/tenants/tenantTypes.db.server";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import SettingSection from "~/components/ui/sections/SettingSection";

type LoaderData = {
  title: string;
  tenantSettingsEntity: EntityWithDetails | null;
  tenant: TenantWithDetails;
  tenantTypes: TenantType[];
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const tenantId = await getTenantIdFromUrl(params);
  await verifyUserHasPermission(request, "app.settings.account.view", tenantId);
  let { t } = await i18nHelper(request);
  const tenantSettingsEntity = await findEntityByName({ tenantId, name: "tenantSettings" });
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw Error(t("shared.notFound"));
  }
  const data: LoaderData = {
    title: `${t("models.tenant.object")} | ${process.env.APP_NAME}`,
    tenantSettingsEntity,
    tenant,
    tenantTypes: await getAllTenantTypes(),
  };
  return json(data);
};

type ActionData = {
  updateDetailsError?: string;
  deleteError?: string;
  success?: string;
};

const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const currentUser = await getUser(userInfo.userId);
  const tenantId = await getTenantIdFromUrl(params);

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";

  const tenant = await getTenant(tenantId);
  if (!tenant) {
    return redirect("/app");
  }

  if (action === "edit") {
    await verifyUserHasPermission(request, "app.settings.account.update", tenantId);
    const name = form.get("name")?.toString() ?? "";
    const slug = form.get("slug")?.toString().toLowerCase() ?? "";
    const icon = form.get("icon")?.toString() ?? "";
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

    const existing = await getTenant(tenantId);
    await createLog(request, tenantId, "Update tenant details", JSON.stringify({ name, slug }));

    const tenantSettingsEntity = await findEntityByName({ tenantId, name: "tenantSettings" });
    if (tenantSettingsEntity) {
      try {
        await RowsApi.createCustom({
          entity: tenantSettingsEntity,
          tenantId,
          t,
          form,
          row: existing?.tenantSettingsRow?.row,
          rowCreateInput: { tenantSettingsRow: { create: { tenantId } } },
        });
      } catch (e: any) {
        return badRequest({ updateDetailsError: e.message });
      }
    }

    if (existing?.slug !== slug) {
      const existingSlug = await getTenantBySlug(slug);
      if (existingSlug) {
        return badRequest({
          updateDetailsError: "Slug already taken",
        });
      }
      let iconStored = icon ? await storeSupabaseFile({ bucket: "accounts-icons", content: icon, id: tenantId }) : icon;
      await updateTenant({ name, icon: iconStored, slug }, tenantId);
      await createAccountUpdatedEvent(tenantId, {
        id: tenant.id,
        new: { name, slug },
        old: { name: tenant.name, slug: tenant.slug },
        user: { id: currentUser?.id ?? "", email: currentUser?.email ?? "" },
      });
      return redirect(`/app/${slug}/settings/account`);
    } else {
      let iconStored = icon ? await storeSupabaseFile({ bucket: "accounts-icons", content: icon, id: tenantId }) : icon;
      await updateTenant({ name, icon: iconStored, slug }, tenantId);
      await createAccountUpdatedEvent(tenantId, {
        id: tenant.id,
        new: { name, slug },
        old: { name: tenant.name, slug: tenant.slug },
        user: { id: currentUser?.id ?? "", email: currentUser?.email ?? "" },
      });
      const actionData: ActionData = {
        success: t("settings.tenant.updated"),
      };
      return json(actionData);
    }
  } else if (action === "delete") {
    await createAccountDeletedEvent(tenantId, userInfo.userId, t);
    await verifyUserHasPermission(request, "app.settings.account.delete", tenantId);
    const activeSubscriptions = await getActiveTenantSubscriptions(tenantId);
    if (activeSubscriptions && activeSubscriptions.products.find((f) => !f.cancelledAt)) {
      return badRequest({
        deleteError: "You cannot delete a tenant with active subscriptions",
      });
    }
    await deleteAndCancelTenant(tenantId);
    return redirect("/app");
  } else {
    return badRequest({ updateDetailsError: t("shared.invalidForm") });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function TenantRoute() {
  const data = useTypedLoaderData<LoaderData>();
  const appData = useAppData();
  const actionData = useActionData<ActionData>();
  const [actionResult, setActionResult] = useState<ActionData>();
  const { t } = useTranslation();
  const submit = useSubmit();

  const confirmDelete = useRef<RefConfirmModal>(null);

  useEffect(() => {
    setActionResult(actionData);
  }, [actionData]);

  function deleteAccount() {
    confirmDelete.current?.show(t("settings.danger.confirmDeleteTenant"), t("shared.confirm"), t("shared.cancel"), t("shared.warningCannotUndo"));
  }
  function confirmDeleteTenant() {
    const form = new FormData();
    form.set("action", "delete");
    submit(form, { method: "post" });
  }

  return (
    <EditPageLayout>
      <SettingSection title={t("settings.tenant.general")} description={t("settings.tenant.generalDescription")}>
        <UpdateTenantDetailsForm
          disabled={!getUserHasPermission(appData, "app.settings.account.update")}
          tenant={data.tenant}
          actionData={actionData}
          tenantSettingsEntity={data.tenantSettingsEntity}
          tenantTypes={data.tenantTypes}
          options={{
            canChangeType: false,
          }}
        />
      </SettingSection>

      {/*Separator */}
      <div className="block">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      {/*Danger */}
      <SettingSection title={t("settings.danger.title")} description={t("settings.danger.description")}>
        <div className="mt-12 md:col-span-2 md:mt-0">
          <div>
            <input hidden type="text" name="action" value="deleteAccount" readOnly />
            <div className="">
              <div className="">
                {/* <h3 className="text-lg font-medium leading-6 text-gray-900">Delete account</h3>
                <div className="mt-2 max-w-xl text-sm leading-5 text-gray-500">
                  <p>Delete organization and cancel subscriptions.</p>
                </div> */}
                <div className="">
                  <ButtonPrimary disabled={!getUserHasPermission(appData, "app.settings.account.delete")} destructive={true} onClick={deleteAccount}>
                    {t("settings.danger.deleteAccount")}
                  </ButtonPrimary>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>

      <ConfirmModal ref={confirmDelete} onYes={confirmDeleteTenant} />

      <OpenErrorModal
        title={t("shared.error")}
        description={actionResult?.deleteError?.toString() ?? ""}
        open={!!actionResult?.deleteError}
        onClose={() => setActionResult(undefined)}
      />
    </EditPageLayout>
  );
}
