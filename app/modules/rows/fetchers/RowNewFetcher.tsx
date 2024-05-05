import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CheckPlanFeatureLimit from "~/components/core/settings/subscription/CheckPlanFeatureLimit";
import Loading from "~/components/ui/loaders/Loading";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { RowsApi } from "~/utils/api/RowsApi";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import RowForm from "../../../components/entities/rows/RowForm";
import { toast } from "react-hot-toast";

interface Props {
  url: string;
  parentEntity?: EntityWithDetails;
  onCreated?: (row: RowWithDetails) => void;
  allEntities: EntityWithDetails[];
  // onSelected: (entity: EntityWithDetails, item: RowWithDetails) => void;
}
export default function RowNewFetcher({ url, parentEntity, onCreated, allEntities }: Props) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  // const actionData = useActionData<{ newRow?: RowWithDetails }>();

  // useEffect(() => {
  //   if (actionData?.newRow && onCreated) {
  //     onCreated(actionData.newRow);
  //   }
  // }, [actionData, onCreated]);

  const [data, setData] = useState<{
    newRow?: RowWithDetails;
    entityData?: EntitiesApi.GetEntityData;
    routes?: EntitiesApi.Routes;
    relationshipRows?: RowsApi.GetRelationshipRowsData;
  }>();

  useEffect(() => {
    if (data?.newRow && onCreated) {
      // console.log("added", data.newRow);
      onCreated(data.newRow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(url);
    }
  }, [url, fetcher]);

  useEffect(() => {
    if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    } else if (fetcher.data) {
      setData(fetcher.data);
    }
  }, [fetcher.data]);

  function onSubmit(formData: FormData) {
    fetcher.submit(formData, {
      action: url,
      method: "post",
    });
  }

  return (
    <div>
      {!fetcher.data ? (
        <Loading />
      ) : !data?.entityData ? (
        <div>No data</div>
      ) : data ? (
        <CheckPlanFeatureLimit item={data.entityData.featureUsageEntity}>
          {data.routes && (
            <RowForm
              entity={data.entityData.entity}
              routes={data.routes}
              parentEntity={parentEntity}
              onSubmit={onSubmit}
              onCreatedRedirect={undefined}
              allEntities={allEntities}
              relationshipRows={data.relationshipRows}
            />
          )}
        </CheckPlanFeatureLimit>
      ) : (
        <div>{t("shared.unknownError")}</div>
      )}
    </div>
  );
}
