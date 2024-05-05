// Route API (Loader and Action): Get row history and comments
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { LoaderFunction, json, ActionFunction } from "@remix-run/node";
import { RowPermissionsDto } from "~/application/dtos/entities/RowPermissionsDto";
import { i18nHelper } from "~/locale/i18n.utils";
import NotificationService from "~/modules/notifications/services/NotificationService";
import { RowCommentsApi } from "~/utils/api/RowCommentsApi";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import { setRowCommentReaction } from "~/utils/db/entities/rowCommentReaction.db.server";
import { getRowComment, updateRowComment } from "~/utils/db/entities/rowComments.db.server";
import { getRowById } from "~/utils/db/entities/rows.db.server";
import { LogWithDetails, getRowLogsById } from "~/utils/db/logs.db.server";
import { getUser } from "~/utils/db/users.db.server";
import { getUserRowPermission } from "~/utils/helpers/PermissionsHelper";
import RowHelper from "~/utils/helpers/RowHelper";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";

export namespace ContractRoutesActivityApi {
  export type LoaderData = {
    metadata: [{ title: string }];
    logs: LogWithDetails[];
    permissions: RowPermissionsDto;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const { t } = await i18nHelper(request);
    const row = await getRowById(params.id!);
    const permissions = await getUserRowPermission(row!, tenantId, userId);
    const data: LoaderData = {
      metadata: [{ title: t("shared.activity") + " | " + process.env.APP_NAME }],
      logs: await getRowLogsById(params.id!),
      permissions,
    };
    return json(data);
  };

  export type ActionData = {
    success?: string;
    error?: string;
  };
  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const { userId } = await getUserInfo(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const form = await request.formData();
    const action = form.get("action")?.toString() ?? "";
    const user = await getUser(userId);
    const entity = await getEntityByName({ tenantId, name: "contract" });
    if (action === "comment") {
      let comment = form.get("comment")?.toString();
      if (!comment) {
        return json({ error: t("shared.invalidForm") }, { status: 400 });
      }
      await RowCommentsApi.create(params.id!, {
        comment,
        userId,
      });
      const item = await getRowById(params.id!);
      if (item!.createdByUser) {
        await NotificationService.send({
          channel: "my-rows",
          to: item!.createdByUser,
          notification: {
            from: { user },
            message: `${user?.email} commented on ${RowHelper.getRowFolio(entity, item!)}`,
            // action: {
            //   title: t("shared.view"),
            //   url: "",
            // },
          },
        });
      }
      return json({ newComment: comment });
    } else if (action === "comment-reaction") {
      const rowCommentId = form.get("comment-id")?.toString();
      const reaction = form.get("reaction")?.toString();
      if (!rowCommentId || !reaction) {
        return json({ error: t("shared.invalidForm") }, { status: 400 });
      }
      await getRowComment(rowCommentId);
      await setRowCommentReaction({
        createdByUserId: userId,
        rowCommentId,
        reaction,
      });
      return json({ newCommentReaction: reaction });
    } else if (action === "comment-delete") {
      const rowCommentId = form.get("comment-id")?.toString();
      if (!rowCommentId) {
        return json({ error: t("shared.invalidForm") }, { status: 400 });
      }
      await updateRowComment(rowCommentId, { isDeleted: true });
      return json({ deletedComment: rowCommentId });
    } else {
      return json({ error: t("shared.invalidForm") }, { status: 400 });
    }
  };
}
