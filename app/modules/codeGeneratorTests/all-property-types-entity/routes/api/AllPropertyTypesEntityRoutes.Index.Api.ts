// Route API (Loader and Action): Get all rows with pagination and filtering
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { LoaderFunction, json } from "@remix-run/node";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";
import { AllPropertyTypesEntityDto } from "../../dtos/AllPropertyTypesEntityDto";
import { AllPropertyTypesEntityService } from "../../services/AllPropertyTypesEntityService";

export namespace AllPropertyTypesEntityRoutesIndexApi {
  export type LoaderData = {
    metadata?: [{ title: string }];
    items: AllPropertyTypesEntityDto[];
    pagination: PaginationDto;
    filterableProperties?: FilterablePropertyDto[];
    overviewItem?: AllPropertyTypesEntityDto | null;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const urlSearchParams = new URL(request.url).searchParams;
    const { items, pagination } = await AllPropertyTypesEntityService.getAll({
      tenantId,
      userId,
      urlSearchParams,
    });
    const data: LoaderData = {
      metadata: [{ title: "All Property Types Entity | " + process.env.APP_NAME }],
      items,
      pagination,
      filterableProperties: EntityHelper.getFilters({ t, entity: await getEntityByName({ tenantId, name: "allPropertyTypesEntity" }) }),
    };
    const overviewId = urlSearchParams.get("overview") ?? "";
    if (overviewId) {
      data.overviewItem = await AllPropertyTypesEntityService.get(overviewId, {
        tenantId,
        userId,
      });
    }
    return json(data);
  };
}