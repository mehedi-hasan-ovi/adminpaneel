// Route API (Loader and Action): Share row with other accounts, users, roles, and groups
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { Tenant } from "@prisma/client";
import { LoaderFunction, json, ActionFunction } from "@remix-run/node";
import { RowAccess } from "~/application/enums/entities/RowAccess";
import { LinkedAccountStatus } from "~/application/enums/tenants/LinkedAccountStatus";
import { i18nHelper } from "~/locale/i18n.utils";
import { RowPermissionsApi } from "~/utils/api/RowPermissionsApi";
import { getLinkedAccounts } from "~/utils/db/linkedAccounts.db.server";
import { getTenant, adminGetAllTenants } from "~/utils/db/tenants.db.server";
import { UserWithDetails, getUsersByTenant } from "~/utils/db/users.db.server";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import { ContractDto } from "../../dtos/ContractDto";
import { ContractService } from "../../services/ContractService";

export namespace ContractRoutesShareApi {
  export type LoaderData = {
    metadata: [{ title: string }];
    item: ContractDto;
    tenants: Tenant[];
    users: UserWithDetails[];
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const item = await ContractService.get(params.id!, {
      tenantId,
      userId,
    });
    if (!item) {
      return json({ error: t("shared.notFound"), status: 404 });
    }
    if (item.row.createdByUserId !== userId) {
      throw Error(t("shared.unauthorized"));
    }
    let tenants: Tenant[] = [];
    if (tenantId) {
      tenants.push((await getTenant(tenantId))!);
      const linkedAccounts = await getLinkedAccounts(tenantId, LinkedAccountStatus.LINKED);
      linkedAccounts.forEach((linkedAccount) => {
        if (linkedAccount.clientTenantId === tenantId) {
          tenants.push(linkedAccount.providerTenant);
        } else {
          tenants.push(linkedAccount.clientTenant);
        }
      });
    } else {
      tenants = await adminGetAllTenants();
    }
    const data: LoaderData = {
      metadata: [{ title: t("shared.share") + " | " + process.env.APP_NAME }],
      item,
      tenants,
      users: (await getUsersByTenant(tenantId)).filter((f) => f.id !== userId),
    };
    return json(data);
  };

  export type ActionData = {
    success?: string;
    error?: string;
  };
  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const form = await request.formData();
    const action = form.get("action")?.toString() ?? "";
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const item = await ContractService.get(params.id!, {
      tenantId,
      userId,
    });

    if (action === "share") {
      const type = form.get("type")?.toString() as "tenant" | "user" | "role" | "group" | "public";
      const id = form.get("id")?.toString() ?? "";
      const access = form.get("access")?.toString() as RowAccess;
      try {
        await RowPermissionsApi.share(item!.row, {
          type,
          id,
          access,
        });
        return json({ success: t("shared.saved") });
      } catch (error: any) {
        return json({ error: error.message }, { status: 400 });
      }
    } else if (action === "set-access") {
      const id = form.get("id")?.toString() ?? "";
      const access = form.get("access")?.toString() as RowAccess;
      await RowPermissionsApi.setAccess(id, access);
      return json({ success: t("shared.saved") });
    } else if (action === "remove") {
      const id = form.get("id")?.toString() ?? "";
      await RowPermissionsApi.del(id);
      return json({ success: t("shared.deleted") });
    } else {
      return json({ error: t("shared.invalidForm") }, { status: 400 });
    }
  };
}
