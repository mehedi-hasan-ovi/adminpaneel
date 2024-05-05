import { LoaderArgs, json } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import { ApiEndpointDto } from "~/modules/api/dtos/ApiEndpointDto";
import { i18nHelper } from "~/locale/i18n.utils";
import ApiSpecsService from "~/modules/api/services/ApiSpecsService";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import ApiSpecs from "~/modules/api/components/ApiSpecs";

type LoaderData = {
  apiSpecs: {
    endpoints: ApiEndpointDto[];
    openApi: any;
    postmanCollection: any;
  };
};
export let loader = async ({ request }: LoaderArgs) => {
  const { t } = await i18nHelper(request);
  const apiSpecs = await ApiSpecsService.generateSpecs({ t });
  const data: LoaderData = {
    apiSpecs,
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
