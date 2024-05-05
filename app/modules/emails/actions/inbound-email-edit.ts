import { json, redirect } from "@remix-run/node";
import { deleteEmail } from "~/utils/db/email/emails.db.server";
import { Params } from "react-router";
import { i18nHelper } from "~/locale/i18n.utils";

export type ActionDataEmails = {
  error?: string;
};
const badRequest = (data: ActionDataEmails) => json(data, { status: 400 });
export const actionInboundEmailEdit = async (request: Request, params: Params, redirectUrl: string) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();

  const action = form.get("action");
  if (action === "delete") {
    await deleteEmail(params.id ?? "");
    return redirect(redirectUrl);
  } else {
    return badRequest({ error: t("shared.invalidForm") });
  }
};
