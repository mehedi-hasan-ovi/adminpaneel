// Route View (Client component): Table with rows and quick row overview
// Date: 2023-01-28
// Version: SaasRock v0.8.2

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
import ContractForm from "../../components/ContractForm";
import { ContractDto } from "../../dtos/ContractDto";
import { ContractRoutesIndexApi } from "../api/ContractRoutes.Index.Api";
import WorkflowStateBadge from "~/components/core/workflows/WorkflowStateBadge";
import RowSelectedOptionCell from "~/components/entities/rows/cells/RowSelectedOptionCell";
import { Colors } from "~/application/enums/shared/Colors";
import RowMediaCell from "~/components/entities/rows/cells/RowMediaCell";
import RowNumberCell from "~/components/entities/rows/cells/RowNumberCell";
import RowBooleanCell from "~/components/entities/rows/cells/RowBooleanCell";
import RowDateCell from "~/components/entities/rows/cells/RowDateCell";
import { useTypedLoaderData } from "remix-typedjson";
export default function ContractRoutesIndexView() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<ContractRoutesIndexApi.LoaderData>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [overviewItem, setOverviewItem] = useState<ContractDto>();

  useEffect(() => {
    setOverviewItem(data.overviewItem ?? undefined);
  }, [data.overviewItem]);

  return (
    <IndexPageLayout
      title={t("Contracts")}
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
            name: "name",
            title: t("Name"),
            value: (item) => <div className="max-w-sm truncate">{item.name}</div>,
          },
          {
            name: "type",
            title: t("Type"),
            value: (item) => (
              <RowSelectedOptionCell
                value={item?.type}
                options={[
                  { name: "Type A", value: "typeA", color: Colors.BLUE },
                  { name: "Type B", value: "typeB", color: Colors.RED },
                ]}
                display={"ValueNameAndColor"}
              />
            ),
          },
          {
            name: "description",
            title: t("Description"),
            value: (item) => <div className="max-w-sm truncate">{item.description}</div>,
          },
          {
            name: "document",
            title: t("Document"),
            value: (item) => <RowMediaCell media={item.document ? [item.document] : []} />,
          },
          {
            name: "documentSigned",
            title: t("Document Signed"),
            value: (item) => <RowMediaCell media={item.documentSigned ? [item.documentSigned] : []} />,
          },
          {
            name: "attachments",
            title: t("Attachments"),
            value: (item) => <RowMediaCell media={item.attachments} />,
          },
          {
            name: "estimatedAmount",
            title: t("Estimated Amount"),
            value: (item) => <RowNumberCell value={item.estimatedAmount} format="decimal" />,
          },
          {
            name: "realAmount",
            title: t("Real amount"),
            value: (item) => <RowNumberCell value={item.realAmount} format="currency" />,
          },
          {
            name: "active",
            title: t("Active"),
            value: (item) => <RowBooleanCell value={item.active} format="activeInactive" />,
          },
          {
            name: "estimatedCompletionDate",
            title: t("Estimated Completion Date"),
            value: (item) => <RowDateCell value={item.estimatedCompletionDate} format="diff" />,
          },
          {
            name: "realCompletionDate",
            title: t("Real Completion Date"),
            value: (item) => <RowDateCell value={item.realCompletionDate} format="YYYY-MM-DD" />,
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
        title={t("Contract")}
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
        {!overviewItem ? <div>{t("shared.loading")}...</div> : <ContractForm item={overviewItem} actionData={actionData} />}
      </SlideOverWideEmpty>
    </IndexPageLayout>
  );
}
