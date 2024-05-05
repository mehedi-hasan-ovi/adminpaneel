import { useFetcher, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import InputFilters from "~/components/ui/input/InputFilters";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { RowsApi } from "~/utils/api/RowsApi";
import { EntitySimple, EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import EntityHelper from "~/utils/helpers/EntityHelper";
import RowNewFetcher from "./RowNewFetcher";
import RowsList from "~/components/entities/rows/RowsList";
import { EntityViewWithDetails } from "~/utils/db/entities/entityViews.db.server";
import { RowDisplayDefaultProperty } from "~/utils/helpers/PropertyHelper";
import InputSelector from "~/components/ui/input/InputSelector";
import RowModel from "../repositories/RowModel";

interface Props {
  entity: EntityWithDetails;
  listUrl: string;
  newUrl: string;
  allEntities: EntityWithDetails[];
  initial?: string;
  onSelected: (row: RowWithDetails) => void;
}
export default function RowSelectorFetcher({ entity, listUrl, newUrl, allEntities, initial, onSelected }: Props) {
  const { t } = useTranslation();
  const fetcher = useFetcher();

  const [selected, setSelected] = useState(initial);

  const [data, setData] = useState<{ rowsData: RowsApi.GetRowsData; routes: EntitiesApi.Routes }>();
  const [adding, setAdding] = useState(false);
  const [rows, setRows] = useState<RowWithDetails[]>([]);

  useEffect(() => {
    const item = rows.find((f) => f.id === selected);
    if (item && item.id !== initial) {
      onSelected(item);
    }
    if (selected === "{new}") {
      setAdding(true);
      // setSelected(undefined);
    }
  }, [selected]);

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(listUrl);
    }
  }, [listUrl, fetcher]);

  useEffect(() => {
    console.log("fetching", { entity: { name: entity.name } });
    fetcher.load(listUrl + `?pageSize=-1`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fetcher.data) {
      const data: { rowsData: RowsApi.GetRowsData } = fetcher.data;
      setData(fetcher.data);
      setRows(data.rowsData.items);
    }
  }, [fetcher.data]);

  function onCreated(row: RowWithDetails) {
    setRows([row, ...rows]);
    setSelected(row.id);
    setAdding(false);
  }

  return (
    <div>
      <InputSelector
        title={t(entity.title)}
        disabled={!data}
        isLoading={!data || fetcher.state === "loading"}
        options={[
          ...(rows.map((f) => {
            const model = new RowModel(f);
            return {
              value: model.row.id,
              name: model.toString(),
            };
          }) ?? []),
          {
            value: "{new}",
            name: ` - ${t("shared.add")} ${t(entity.title)} - `,
          },
        ]}
        value={selected}
        setValue={(e) => setSelected(e?.toString() ?? "")}
      />

      <SlideOverWideEmpty
        title={t("shared.create") + " " + t(data?.rowsData?.entity.title ?? "")}
        className="max-w-md"
        open={adding}
        onClose={() => {
          setAdding(false);
          if (selected === "{new}") {
            setSelected(undefined);
          }
        }}
      >
        <RowNewFetcher url={newUrl} parentEntity={entity} onCreated={onCreated} allEntities={allEntities} />
      </SlideOverWideEmpty>
    </div>
  );
}
