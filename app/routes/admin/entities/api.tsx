import { LoaderArgs, json } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import { i18nHelper } from "~/locale/i18n.utils";
import ApiSpecsService, { ApiSpecsDto } from "~/modules/api/services/ApiSpecsService";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import ApiSpecs from "~/modules/api/components/ApiSpecs";

type LoaderData = {
  apiSpecs: ApiSpecsDto;
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const { t } = await i18nHelper(request);
  const data: LoaderData = {
    apiSpecs: await ApiSpecsService.generateSpecs({ t }),
  };
  return json(data);
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();

  return (
    <EditPageLayout title="API Docs">
      <ApiSpecs item={data.apiSpecs} />
    </EditPageLayout>
  );
}
