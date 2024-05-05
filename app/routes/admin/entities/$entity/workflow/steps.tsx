import { json, LoaderFunction, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { useTypedLoaderData } from "remix-typedjson";
import WorkflowStepsTable from "~/components/core/workflows/WorkflowStepsTable";
import { getEntityBySlug } from "~/utils/db/entities/entities.db.server";
import { EntityWorkflowStepWithDetails, getWorkflowSteps } from "~/utils/db/workflows/workflowSteps.db.server";

type LoaderData = {
  items: EntityWorkflowStepWithDetails[];
};
export let loader: LoaderFunction = async ({ params }) => {
  const entity = await getEntityBySlug({ tenantId: null, slug: params.entity! });
  if (!entity) {
    return redirect("/admin/entities");
  }
  const items = await getWorkflowSteps(entity.id);
  const data: LoaderData = {
    items,
  };
  return json(data);
};

export default function EntityWorkflowRoute() {
  const data = useTypedLoaderData<LoaderData>();
  return (
    <div>
      <WorkflowStepsTable items={data.items} />

      <Outlet />
    </div>
  );
}
