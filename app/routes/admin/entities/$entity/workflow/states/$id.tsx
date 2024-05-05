import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import EntityWorkflowStateForm from "~/components/entities/workflow/EntityWorkflowStateForm";
import OpenModal from "~/components/ui/modals/OpenModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import {
  deleteWorkflowState,
  EntityWorkflowStateWithSteps,
  getWorkflowState,
  getWorkflowStates,
  updateWorkflowState,
} from "~/utils/db/workflows/workflowStates.db.server";

type LoaderData = {
  item: EntityWorkflowStateWithSteps;
};
export let loader: LoaderFunction = async ({ params }) => {
  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!entity) {
    return redirect("/admin/entities");
  }
  const item = await getWorkflowState(params.id ?? "");
  if (!item) {
    return redirect(`/admin/entities/${params.entity}/workflow/states`);
  }
  const data: LoaderData = {
    item,
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

  const existing = await getWorkflowState(params.id ?? "");
  if (!existing) {
    return badRequest({ error: t("shared.notFound") });
  }

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";

  if (action === "edit") {
    try {
      const name = form.get("name")?.toString().toLowerCase().trim() ?? "";
      const title = form.get("title")?.toString().trim() ?? "";

      const states = await getWorkflowStates(entity.id);
      const existingName = states.find((state) => state.id !== existing.id && state.name.toLowerCase().trim() === name);
      if (existingName) {
        return badRequest({ error: "There is already a state with this name" });
      }
      const existingTitle = states.find((state) => state.id !== existing.id && state.title.toLowerCase().trim() === title.toLowerCase().trim());
      if (existingTitle) {
        return badRequest({ error: "There is already a state with this title" });
      }
      await updateWorkflowState(existing.id, {
        name,
        title,
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
  } else if (action === "delete") {
    await deleteWorkflowState(existing.id);
    return redirect(`/admin/entities/${params.entity}/workflow/states`);
  }
  return badRequest({ error: t("shared.invalidForm") });
};

export default function EditEntityWorkflowStateRoute() {
  const data = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();
  function close() {
    navigate(`/admin/entities/${params.entity}/workflow/states`);
  }
  return (
    <OpenModal className="sm:max-w-sm" onClose={close}>
      <EntityWorkflowStateForm item={data.item} />
    </OpenModal>
  );
}
