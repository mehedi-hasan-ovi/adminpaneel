import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "@remix-run/react";
import RowForm from "~/components/entities/rows/RowForm";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { getEntityPermission, getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import NewPageLayout from "~/components/ui/layouts/NewPageLayout";
import RowHelper from "~/utils/helpers/RowHelper";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { Rows_Edit } from "../routes/Rows_Edit.server";
import { useTypedLoaderData } from "remix-typedjson";

type EditRowOptions = {
  hideTitle?: boolean;
  hideMenu?: boolean;
  hideShare?: boolean;
  hideTags?: boolean;
  hideTasks?: boolean;
  hideActivity?: boolean;
  disableUpdate?: boolean;
  disableDelete?: boolean;
};

interface Props {
  layout?: "edit" | "simple";
  children?: ReactNode;
  title?: ReactNode;
  rowFormChildren?: ReactNode;
  options?: EditRowOptions;
}

export default function RowEditRoute({ rowFormChildren, options }: Props) {
  const { rowData, routes, allEntities, relationshipRows } = useTypedLoaderData<Rows_Edit.LoaderData>();
  const appOrAdminData = useAppOrAdminData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <NewPageLayout
      title={t("shared.edit") + " " + t(rowData.entity.title)}
      menu={[
        { title: t(rowData.entity.titlePlural), routePath: EntityHelper.getRoutes({ routes, entity: rowData.entity })?.list },
        {
          title: RowHelper.getRowFolio(rowData.entity, rowData.item),
          routePath: EntityHelper.getRoutes({ routes, entity: rowData.entity, item: rowData.item })?.overview,
        },
        {
          title: t("shared.edit"),
          routePath: EntityHelper.getRoutes({ routes, entity: rowData.entity, item: rowData.item })?.edit,
        },
      ]}
    >
      <RowForm
        allEntities={allEntities}
        entity={rowData.entity}
        routes={routes}
        item={rowData.item}
        editing={true}
        canDelete={
          !options?.disableDelete && getUserHasPermission(appOrAdminData, getEntityPermission(rowData.entity, "delete")) && rowData.rowPermissions.canDelete
        }
        canUpdate={
          !options?.disableUpdate && getUserHasPermission(appOrAdminData, getEntityPermission(rowData.entity, "update")) && rowData.rowPermissions.canUpdate
        }
        relationshipRows={relationshipRows}
        onCancel={() => navigate(EntityHelper.getRoutes({ routes, entity: rowData.entity, item: rowData.item })?.overview ?? "")}
      >
        {rowFormChildren}
      </RowForm>
      <Outlet />
    </NewPageLayout>
  );
}
