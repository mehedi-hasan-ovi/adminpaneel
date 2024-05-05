import { EntityWorkflowState } from "@prisma/client";
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import EntityWorkflowStepForm from "~/components/entities/workflow/EntityWorkflowStepForm";
import OpenModal from "~/components/ui/modals/OpenModal";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { getWorkflowStates } from "~/utils/db/workflows/workflowStates.db.server";
import { createWorkflowStep } from "~/utils/db/workflows/workflowSteps.db.server";

type LoaderData = {
  title: string;
  states: EntityWorkflowState[];
};
export let loader: LoaderFunction = async ({ params }) => {
  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!entity) {
    return redirect("/admin/entities");
  }
  const data: LoaderData = {
    title: `Workflow Steps | ${process.env.APP_NAME}`,
    states: await getWorkflowStates(entity.id),
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
      await createWorkflowStep({
        entityId: entity.id,
        action: form.get("action-title")?.toString() ?? "",
        fromStateId: form.get("from-state-id")?.toString() ?? "",
        toStateId: form.get("to-state-id")?.toString() ?? "",
        assignTo: "private",
      });
      return redirect(`/admin/entities/${params.entity}/workflow/steps`);
    } catch (e: any) {
      return badRequest({ error: e.message });
    }
  }
  return badRequest({ error: t("shared.invalidForm") });
};

export default function NewEntityWorkflowStepRoute() {
  const data = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();
  function close() {
    navigate(`/admin/entities/${params.entity}/workflow/steps`);
  }
  return (
    <OpenModal className="sm:max-w-sm" onClose={close}>
      <EntityWorkflowStepForm states={data.states} />
    </OpenModal>
  );
}
