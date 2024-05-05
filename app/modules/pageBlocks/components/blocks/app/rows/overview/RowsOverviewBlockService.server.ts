import { json, redirect } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { PageBlockActionArgs } from "~/modules/pageBlocks/dtos/PageBlockActionArgs";
import { PageBlockLoaderArgs } from "~/modules/pageBlocks/dtos/PageBlockLoaderArgs";
import { RowsApi } from "~/utils/api/RowsApi";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import { getEntityPermission, verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import RowHelper from "~/utils/helpers/RowHelper";
import { getUserInfo } from "~/utils/session.server";
import { BlockVariableService } from "../../../shared/variables/BlockVariableService.server";
import { RowsOverviewBlockData } from "./RowsOverviewBlockUtils";

export namespace RowsOverviewBlockService {
  export async function load({ request, params, block }: PageBlockLoaderArgs): Promise<RowsOverviewBlockData> {
    const entityName = BlockVariableService.getValue({ request, params, variable: block.rowsOverview?.variables?.entityName });
    const tenantId = BlockVariableService.getValue({ request, params, variable: block.rowsOverview?.variables?.tenantId });
    const rowId = BlockVariableService.getValue({ request, params, variable: block.rowsOverview?.variables?.rowId });

    const userId = (await getUserInfo(request)).userId;
    const entity = await getEntityByName({ tenantId, name: entityName! });
    const rowData = await RowsApi.get(rowId!, {
      entity,
      tenantId,
      userId,
    });
    return {
      rowData,
      relationshipRows: await RowsApi.getRelationshipRows({ entity, tenantId, userId }),
    };
  }
  export async function create({ request, params, form }: PageBlockActionArgs) {
    const entityName = form.get("rows-entity")?.toString();
    const tenantId = form.get("rows-tenant")?.toString() ?? null;

    const userInfo = await getUserInfo(request);
    const entity = await getEntityByName({ tenantId, name: entityName! });

    await verifyUserHasPermission(request, getEntityPermission(entity, "create"), tenantId);
    const { t } = await i18nHelper(request);
    const rowValues = RowHelper.getRowPropertiesFromForm({ t, entity, form });
    const newRow = await RowsApi.create({
      entity,
      tenantId,
      userId: userInfo.userId,
      rowValues,
    });
    const redirectTo = form.get("redirect")?.toString() || new URL(request.url).searchParams.get("redirect")?.toString();
    if (redirectTo) {
      return redirect(redirectTo);
    }
    return json({ newRow });
  }
}
