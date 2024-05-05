import { json, LoaderFunction, redirect, V2_MetaFunction } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import PromptResults from "~/modules/promptBuilder/components/PromptResults";
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
    title: `${item.title} | Results | ${t("prompts.builder.title")} | ${process.env.APP_NAME}`,
    item,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default function () {
  const data = useTypedLoaderData<LoaderData>();
  return (
    <EditPageLayout
      title={`All Results - ${data.item.title}`}
      menu={[
        {
          title: "Prompts",
          routePath: "/admin/prompts/builder",
        },
        {
          title: "Executions",
          routePath: `/admin/prompts/executions/${data.item.id}`,
        },
        {
          title: "All Results",
          routePath: `/admin/prompts/results/${data.item.id}`,
        },
      ]}
    >
      <PromptResults item={data.item} />
    </EditPageLayout>
  );
}
