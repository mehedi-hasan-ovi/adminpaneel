import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loading from "~/components/ui/loaders/Loading";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { RowsApi } from "~/utils/api/RowsApi";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { getEntityPermission, getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import RowForm from "../../../components/entities/rows/RowForm";
import RowTags from "../../../components/entities/rows/RowTags";

interface Props {
  url: string;
  onUpdated?: (row: RowWithDetails) => void;
  onDeleted?: () => void;
  allEntities: EntityWithDetails[];
}
export default function RowEditFetcher({ url, onUpdated, allEntities, onDeleted }: Props) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const appOrAdminData = useAppOrAdminData();

  const [data, setData] = useState<{
    rowData?: RowsApi.GetRowData;
    routes?: EntitiesApi.Routes;
    updatedRow?: RowsApi.GetRowData;
    relationshipRows?: RowsApi.GetRelationshipRowsData;
  }>();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(fetcher.type);
    if (fetcher.type === "init") {
      fetcher.load(url);
    }
  }, [url, fetcher]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log({
      type: fetcher.type,
      action: fetcher.submission?.formData.get("action"),
      // data: fetcher.data
    });
    if (fetcher.type === "done") {
      if (fetcher.data?.rowData && fetcher.data?.routes) {
        setData(fetcher.data);
      }
    }
    if (fetcher.type === "actionReload") {
      if (fetcher.data?.updatedRow?.item && onUpdated) {
        onUpdated(fetcher.data.updatedRow.item);
      }
      if (fetcher.data?.deleted && onDeleted) {
        onDeleted();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

  function onSubmit(formData: FormData) {
    fetcher.submit(formData, {
      action: url,
      method: "post",
    });
  }

  function onDelete() {
    const formData = new FormData();
    formData.set("action", "delete");
    formData.set("id", data?.rowData?.item.id ?? "");
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
            <div className="space-y-2">
              {data.rowData.item.tags.length > 0 && <RowTags items={data.rowData.item.tags} />}
              <RowForm
                allEntities={allEntities}
                entity={data.rowData.entity}
                routes={data.routes}
                item={data.rowData.item}
                editing={true}
                canDelete={getUserHasPermission(appOrAdminData, getEntityPermission(data.rowData.entity, "delete")) && data.rowData.rowPermissions.canDelete}
                canUpdate={getUserHasPermission(appOrAdminData, getEntityPermission(data.rowData.entity, "update")) && data.rowData.rowPermissions.canUpdate}
                onSubmit={onSubmit}
                onDelete={onDelete}
                relationshipRows={data.relationshipRows}
              />
            </div>
          )}
        </div>
      ) : (
        <div>{t("shared.unknownError")}</div>
      )}
    </div>
  );
}
