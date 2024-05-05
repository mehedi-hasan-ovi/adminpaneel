import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import EntityWorkflowStateForm from "~/components/entities/workflow/EntityWorkflowStateForm";
import OpenModal from "~/components/ui/modals/OpenModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { createWorkflowState, getWorkflowStates } from "~/utils/db/workflows/workflowStates.db.server";

type LoaderData = {
  title: string;
};
export let loader: LoaderFunction = async () => {
  const data: LoaderData = {
    title: `Workflow States | ${process.env.APP_NAME}`,
  };
  return json(data);
};

type ActionData = {
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);

  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!entity) {
    return redirect("/admin/entities");
  }

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";

  if (action === "create") {
    try {
      const name = form.get("name")?.toString().toLowerCase().trim() ?? "";
      const title = form.get("title")?.toString().trim() ?? "";
      const states = await getWorkflowStates(entity.id);
      const existingName = states.find((state) => state.name.toLowerCase().trim() === name);
      if (existingName) {
        return badRequest({ error: "There is already a state with this name" });
      }
      const existingTitle = states.find((state) => state.title.toLowerCase().trim() === title.toLowerCase());
      if (existingTitle) {
        return badRequest({ error: "There is already a state with this title" });
      }
      let maxOrder = 0;
      if (states.length > 0) {
        maxOrder = Math.max(...states.map((state) => state.order));
      }
      await createWorkflowState({
        entityId: entity.id,
        order: maxOrder + 1,
        name,
        title,
        // status: Number(form.get("status")),
        color: Number(form.get("color")),
        canUpdate: Boolean(form.get("can-update")),
        canDelete: Boolean(form.get("can-delete")),
        emailSubject: form.get("email-subject")?.toString() ?? "",
        emailBody: form.get("email-body")?.toString() ?? "",
      });
      return redirect(`/admin/entities/${params.entity}/workflow/states`);
    } catch (e: any) {
      return badRequest({ error: e.message });
    }
  }
  return badRequest({ error: t("shared.invalidForm") });
};

export default function NewEntityWorkflowStateRoute() {
  const params = useParams();
  const navigate = useNavigate();
  function close() {
    navigate(`/admin/entities/${params.entity}/workflow/states`);
  }
  return (
    <OpenModal className="sm:max-w-sm" onClose={close}>
      <EntityWorkflowStateForm />
    </OpenModal>
  );
}
