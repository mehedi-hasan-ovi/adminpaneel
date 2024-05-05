import { ActionArgs, json, LoaderFunction, redirect, V2_MetaFunction } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useTypedLoaderData } from "remix-typedjson";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import PromptExecutions from "~/modules/promptBuilder/components/PromptExecutions";
import { deletePromptFlowExecution, getPromptFlowExecution } from "~/modules/promptBuilder/db/promptExecutions.db.server";
import { getPromptFlowWithExecutions, PromptFlowWithExecutions } from "~/modules/promptBuilder/db/promptFlows.db.server";

type LoaderData = {
  title: string;
  item: PromptFlowWithExecutions;
};
export let loader: LoaderFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  const item = await getPromptFlowWithExecutions(params.id ?? "");
  if (!item) {
    return redirect("/admin/prompts/builder");
  }

  const data: LoaderData = {
    title: `${item.title} | Executions | ${t("prompts.builder.title")} | ${process.env.APP_NAME}`,
    item,
  };
  return json(data);
};

export const action = async ({ request }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  if (action === "delete") {
    const id = form.get("id")?.toString() ?? "";
    const execution = getPromptFlowExecution(id);
    if (!execution) {
      return json({ error: t("shared.notFound") }, { status: 400 });
    }
    await deletePromptFlowExecution(id);
    return json({ success: true });
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function () {
  const data = useTypedLoaderData<LoaderData>();
  const submit = useSubmit();
  function onDelete(id: string) {
    const form = new FormData();
    form.set("action", "delete");
    form.set("id", id);
    submit(form, {
      method: "post",
    });
  }
  return (
    <EditPageLayout
      title={`Executions - ${data.item.title}`}
      withHome={false}
      menu={[
        {
          title: "Prompts",
          routePath: "/admin/prompts/builder",
        },
        {
          title: "Execution",
          routePath: `/admin/prompts/executions/${data.item.id}`,
        },
      ]}
    >
      <PromptExecutions item={data.item} onDelete={onDelete} />
    </EditPageLayout>
  );
}
