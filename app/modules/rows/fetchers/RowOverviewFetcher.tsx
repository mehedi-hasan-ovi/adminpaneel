import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loading from "~/components/ui/loaders/Loading";
import RowOverviewRoute from "~/modules/rows/components/RowOverviewRoute";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { RowsApi } from "~/utils/api/RowsApi";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";

interface Props {
  url: string;
  onUpdated?: (row: RowWithDetails) => void;
  allEntities: EntityWithDetails[];
  onClose: () => void;
}
export default function RowOverviewFetcher({ url, onUpdated, allEntities, onClose }: Props) {
  const { t } = useTranslation();
  const fetcher = useFetcher();

  const [data, setData] = useState<{
    rowData?: RowsApi.GetRowData;
    routes?: EntitiesApi.Routes;
    relationshipRows?: RowsApi.GetRelationshipRowsData;
  }>();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(url);
    }
  }, [url, fetcher]);

  useEffect(() => {
    if (fetcher.data?.rowData && fetcher.data?.routes) {
      setData(fetcher.data);
    }
  }, [fetcher.data, onClose]);

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
      ) : !data?.rowData ? (
        <div>No data</div>
      ) : data ? (
        <div>
          {data.routes && (
            <RowOverviewRoute
              layout="edit"
              rowData={data.rowData}
              item={data.rowData.item}
              // routes={data.routes}
              onSubmit={onSubmit}
              relationshipRows={data.relationshipRows}
            />
          )}
        </div>
      ) : (
        <div>{t("shared.unknownError")}</div>
      )}
    </div>
  );
}
