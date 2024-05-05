import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import WorkflowStatesTable from "~/components/core/workflows/WorkflowStatesTable";
import { getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { EntityWorkflowStateWithSteps, getWorkflowStates, updateWorkflowState } from "~/utils/db/workflows/workflowStates.db.server";

type LoaderData = {
  items: EntityWorkflowStateWithSteps[];
};
export let loader: LoaderFunction = async ({ params }) => {
  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!entity) {
    return redirect("/admin/entities");
  }
  const items = await getWorkflowStates(entity.id);
  const data: LoaderData = {
    items,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const item = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!item) {
    return redirect("/admin/entities");
  }

  const form = await request.formData();
  const action = form.get("action")?.toString() ?? "";
  if (action === "set-orders") {
    const items: { id: string; order: number }[] = form.getAll("orders[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });
    await Promise.all(
      items.map(async ({ id, order }) => {
        await updateWorkflowState(id, { order: Number(order) });
      })
    );
    return json({
      items: await getWorkflowStates(item.id),
    });
  }
};

export default function EntityWorkflowRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <div>
      <WorkflowStatesTable items={data.items} />

      <Outlet />
    </div>
  );
}
