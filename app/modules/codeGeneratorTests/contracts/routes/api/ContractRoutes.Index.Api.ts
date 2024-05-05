// Route API (Loader and Action): Get all rows with pagination and filtering
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { LoaderFunction, json } from "@remix-run/node";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import { ContractDto } from "../../dtos/ContractDto";
import { ContractService } from "../../services/ContractService";

export namespace ContractRoutesIndexApi {
  export type LoaderData = {
    metadata?: [{ title: string }];
    items: ContractDto[];
    pagination: PaginationDto;
    filterableProperties?: FilterablePropertyDto[];
    overviewItem?: ContractDto | null;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const urlSearchParams = new URL(request.url).searchParams;
    const { items, pagination } = await ContractService.getAll({
      tenantId,
      userId,
      urlSearchParams,
    });
    const data: LoaderData = {
      metadata: [{ title: "Contract | " + process.env.APP_NAME }],
      items,
      pagination,
      filterableProperties: EntityHelper.getFilters({ t, entity: await getEntityByName({ tenantId, name: "contract" }) }),
    };
    const overviewId = urlSearchParams.get("overview") ?? "";
    if (overviewId) {
      data.overviewItem = await ContractService.get(overviewId, {
        tenantId,
        userId,
      });
    }
    return json(data);
  };
}
