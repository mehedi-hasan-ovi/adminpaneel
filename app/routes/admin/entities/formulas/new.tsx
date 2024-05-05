import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { redirect, useTypedActionData } from "remix-typedjson";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import { i18nHelper } from "~/locale/i18n.utils";
import FormulaForm from "~/modules/formulas/components/FormulaForm";
import { createFormula } from "~/modules/formulas/db/formulas.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

export let loader = async ({ request }: LoaderArgs) => {
  await verifyUserHasPermission(request, "admin.formulas.create");
  return json({});
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action = async ({ request }: ActionArgs) => {
  await verifyUserHasPermission(request, "admin.formulas.create");
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  if (action === "new") {
    const name = form.get("name")?.toString() ?? "";
    const description = form.get("description")?.toString() ?? "";
    const resultAs = form.get("resultAs")?.toString();
    const calculationTrigger = form.get("calculationTrigger")?.toString();
    const withLogs = ["true", "on"].includes(form.get("withLogs")?.toString() ?? "false");

    const components: { order: number; type: string; value: string }[] = form.getAll("components[]").map((f) => {
      return JSON.parse(f.toString());
    });

    if (!name || !resultAs || !calculationTrigger) {
      return json({ error: "Missing required fields." }, { status: 400 });
    }
    if (components.length === 0) {
      return json({ error: "Missing formula components." }, { status: 400 });
    }

    try {
      await createFormula({
        name,
        description,
        resultAs,
        calculationTrigger,
        components,
        withLogs,
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);
    }

    return redirect("/admin/entities/formulas");
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function () {
  const actionData = useTypedActionData<ActionData>();

  return (
    <div>
      <FormulaForm item={undefined} />

      <ActionResultModal actionData={actionData ?? undefined} showSuccess={false} />
    </div>
  );
}
