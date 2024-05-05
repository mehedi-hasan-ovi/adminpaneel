import CodeGeneratorHelper from "~/modules/codeGenerator/utils/CodeGeneratorHelper";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";

function generate({ entity }: { entity: EntityWithDetails }): string {
  const { capitalized, name, title } = CodeGeneratorHelper.getNames(entity);
  const imports: string[] = [];
  imports.push(`import { LoaderFunction, json } from "@remix-run/node";
import { FilterablePropertyDto } from "~/application/dtos/data/FilterablePropertyDto";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityByName } from "~/utils/db/entities/entities.db.server";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { getTenantIdOrNull } from "~/utils/services/urlService";
import { getUserInfo } from "~/utils/session.server";`);
  imports.push(`import { ${capitalized}Dto } from "../../dtos/${capitalized}Dto";
import { ${capitalized}Service } from "../../services/${capitalized}Service";`);

  let template = `
export namespace ${capitalized}RoutesIndexApi {
  export type LoaderData = {
    metadata?: [{ title: string }];
    items: ${capitalized}Dto[];
    pagination: PaginationDto;
    filterableProperties?: FilterablePropertyDto[];
    overviewItem?: ${capitalized}Dto | null;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const tenantId = await getTenantIdOrNull({ request, params });
    const userId = (await getUserInfo(request)).userId;
    const urlSearchParams = new URL(request.url).searchParams;
    const { items, pagination } = await ${capitalized}Service.getAll({
      tenantId,
      userId,
      urlSearchParams,
    });
    const data: LoaderData = {
      metadata: [{ title: "${title} | " + process.env.APP_NAME }],
      items,
      pagination,
      filterableProperties: EntityHelper.getFilters({ t, entity: await getEntityByName({ tenantId, name: "${name}" }) }),
    };
    const overviewId = urlSearchParams.get("overview") ?? "";
    if (overviewId) {
      data.overviewItem = await ${capitalized}Service.get(overviewId, {
        tenantId,
        userId,
      });
    }
    return json(data);
  };
}`;

  const uniqueImports = [...new Set(imports)];
  return [...uniqueImports, template].join("\n");
}

export default {
  generate,
};
