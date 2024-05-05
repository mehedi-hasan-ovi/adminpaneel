// Route View (Client component): Table with rows and quick row overview
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { useActionData, useSearchParams, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import RowCreatedByCell from "~/components/entities/rows/cells/RowCreatedByCell";
import RowFolioCell from "~/components/entities/rows/cells/RowFolioCell";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import DateCell from "~/components/ui/dates/DateCell";
import ExternalLinkEmptyIcon from "~/components/ui/icons/ExternalLinkEmptyIcon";
import InputFilters from "~/components/ui/input/InputFilters";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
import TableSimple from "~/components/ui/tables/TableSimple";
import { useTypedLoaderData } from "remix-typedjson";
import AllPropertyTypesEntityForm from "../../components/AllPropertyTypesEntityForm";
import { AllPropertyTypesEntityDto } from "../../dtos/AllPropertyTypesEntityDto";
import { AllPropertyTypesEntityRoutesIndexApi } from "../api/AllPropertyTypesEntityRoutes.Index.Api";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import RowNumberCell from "~/components/entities/rows/cells/RowNumberCell";
import RowDateCell from "~/components/entities/rows/cells/RowDateCell";
import RowSelectedOptionCell from "~/components/entities/rows/cells/RowSelectedOptionCell";
import { Colors } from "~/application/enums/shared/Colors";
import RowBooleanCell from "~/components/entities/rows/cells/RowBooleanCell";
import RowMediaCell from "~/components/entities/rows/cells/RowMediaCell";
import PropertyMultipleValueBadge from "~/components/entities/properties/PropertyMultipleValueBadge";
import RowRangeNumberCell from "~/components/entities/rows/cells/RowRangeNumberCell";
import RowRangeDateCell from "~/components/entities/rows/cells/RowRangeDateCell";

export default function AllPropertyTypesEntityRoutesIndexView() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<AllPropertyTypesEntityRoutesIndexApi.LoaderData>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [overviewItem, setOverviewItem] = useState<AllPropertyTypesEntityDto>();

  useEffect(() => {
    setOverviewItem(data.overviewItem ?? undefined);
  }, [data.overviewItem]);

  return (
    <IndexPageLayout
      title={t("All Property Types Entity")}
      buttons={
        <>
          {!!data.filterableProperties?.length && <InputFilters filters={data.filterableProperties} />}
          <ButtonPrimary to="new">{t("shared.new")}</ButtonPrimary>
        </>
      }
    >
      <TableSimple
        items={data.items}
        pagination={data.pagination}
        actions={[
          {
            title: t("shared.overview"),
            onClick: (_, item) => {
              searchParams.set("overview", item.row.id);
              setSearchParams(searchParams);
            },
          },
          {
            title: t("shared.edit"),
            onClickRoute: (_, item) => item.row.id,
          },
        ]}
        headers={[
          {
            name: "folio",
            title: t("models.row.folio"),
            value: (item) => <RowFolioCell prefix={item.prefix} folio={item.row.folio} href={item.row.id} />,
          },
          {
            name: "workflowState",
            title: t("models.row.workflowState"),
            value: (item) => <WorkflowStateBadge state={item.row.workflowState} />,
          },
          {
            name: "textSingleLine",
            title: t("Text (Single-line)"),
            value: (item) => <div className="max-w-sm truncate">{item.textSingleLine}</div>,
          },
          {
            name: "textEmail",
            title: t("Text (Email)"),
            value: (item) => <div className="max-w-sm truncate">{item.textEmail}</div>,
          },
          {
            name: "textPhone",
            title: t("Text (Phone)"),
            value: (item) => <div className="max-w-sm truncate">{item.textPhone}</div>,
          },
          {
            name: "textUrl",
            title: t("Text (URL)"),
            value: (item) => <div className="max-w-sm truncate">{item.textUrl}</div>,
          },
          {
            name: "number",
            title: t("Number"),
            value: (item) => <RowNumberCell value={item.number}  />,
          },
          {
            name: "date",
            title: t("Date"),
            value: (item) => <RowDateCell value={item.date}  />,
          },
          {
            name: "singleSelectDropdown",
            title: t("Single Select (Dropdown)"),
            value: (item) => <RowSelectedOptionCell value={item?.singleSelectDropdown} display="Value" options={[{ name: null, value: "Option 1", color: Colors.UNDEFINED },{ name: null, value: "Option 2", color: Colors.UNDEFINED },{ name: null, value: "Option 3", color: Colors.UNDEFINED }]} />,
          },
          {
            name: "singleSelectRadioGroupCards",
            title: t("Single Select (Radio Group Cards)"),
            value: (item) => <RowSelectedOptionCell value={item?.singleSelectRadioGroupCards} display="Value" options={[{ name: null, value: "Option 1", color: Colors.UNDEFINED },{ name: null, value: "Option 2", color: Colors.UNDEFINED },{ name: null, value: "Option 3", color: Colors.UNDEFINED }]} />,
          },
          {
            name: "boolean",
            title: t("Boolean"),
            value: (item) => <RowBooleanCell value={item.boolean}  />,
          },
          {
            name: "media",
            title: t("Media"),
            value: (item) => <RowMediaCell media={item.media}  />,
          },
          {
            name: "multiSelectCombobox",
            title: t("Multi Select (Combobox)"),
            value: (item) => <PropertyMultipleValueBadge values={item.multiSelectCombobox} />,
          },
          {
            name: "multiSelectCheckboxCards",
            title: t("Multi Select (Checkbox Cards)"),
            value: (item) => <PropertyMultipleValueBadge values={item.multiSelectCheckboxCards} />,
          },
          {
            name: "numberRange",
            title: t("Number Range"),
            value: (item) => <RowRangeNumberCell value={item.numberRange}  />,
          },
          {
            name: "dateRange",
            title: t("Date Range"),
            value: (item) => <RowRangeDateCell value={item.dateRange}  />,
          },
          {
            name: "multiText",
            title: t("Multi Text"),
            value: (item) => <PropertyMultipleValueBadge values={item.multiText} />,
          },
          {
            name: "createdAt",
            title: t("shared.createdAt"),
            value: (item) => <DateCell date={item.row.createdAt} />,
            className: "text-gray-400 text-xs",
            breakpoint: "sm",
          },
          {
            name: "createdByUser",
            title: t("shared.createdBy"),
            value: (item) => <RowCreatedByCell user={item.row.createdByUser} apiKey={item.row.createdByApiKey} />,
            className: "text-gray-400 text-xs",
            breakpoint: "sm",
          },
        ]}
      />
      <SlideOverWideEmpty
        withTitle={false}
        withClose={false}
        title={t("AllPropertyTypesEntity")}
        open={!!searchParams.get("overview")?.toString()}
        onClose={() => {
          searchParams.delete("overview");
          setSearchParams(searchParams);
          setTimeout(() => {
            setOverviewItem(undefined);
          }, 100);
        }}
        className="sm:max-w-md"
        buttons={
          <>
            <Link
              to={overviewItem?.row.id ?? ""}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close panel</span>
              <ExternalLinkEmptyIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
          </>
        }
      >
        {!overviewItem ? <div>{t("shared.loading")}...</div> : <AllPropertyTypesEntityForm item={overviewItem} actionData={actionData} />}
      </SlideOverWideEmpty>
    </IndexPageLayout>
  );
}
