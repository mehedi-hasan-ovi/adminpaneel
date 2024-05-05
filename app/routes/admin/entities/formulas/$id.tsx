import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { redirect, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import { i18nHelper } from "~/locale/i18n.utils";
import FormulaForm from "~/modules/formulas/components/FormulaForm";
import { deleteFormula, getFormula, updateFormula } from "~/modules/formulas/db/formulas.db.server";
import { FormulaDto } from "~/modules/formulas/dtos/FormulaDto";
import FormulaHelpers from "~/modules/formulas/utils/FormulaHelpers";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  item: FormulaDto;
};
export let loader = async ({ request, params }: LoaderArgs) => {
  await verifyUserHasPermission(request, "admin.formulas.update");
  const item = await getFormula(params.id!);
  if (!item) {
    return redirect("/admin/entities/formulas");
  }
  const data: LoaderData = {
    item: FormulaHelpers.getFormulaDto(item),
  };
  return json(data);
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action = async ({ request, params }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  const item = await getFormula(params.id!);
  if (!item) {
    return redirect("/admin/entities/formulas");
  }

  if (action === "edit") {
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
      await updateFormula(item.id, {
        name,
        description,
        resultAs,
        calculationTrigger,
        withLogs,
        components,
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);
    }

    return redirect("/admin/entities/formulas");
  } else if (action === "delete") {
    await deleteFormula(params.id!);
    return redirect("/admin/entities/formulas");
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedActionData<ActionData>();
  const submit = useSubmit();

  function onDelete() {
    const form = new FormData();
    form.set("action", "delete");
    submit(form, {
      method: "post",
    });
  }
  return (
    <div>
      <FormulaForm item={data.item} onDelete={onDelete} />

      <ActionResultModal actionData={actionData ?? undefined} showSuccess={false} />
    </div>
  );
}
