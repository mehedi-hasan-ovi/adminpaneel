import { Entity, Property, Row } from "@prisma/client";
import { TFunction } from "react-i18next";
import { Params } from "react-router";
import { PaginationDto } from "~/application/dtos/data/PaginationDto";
import { PropertyType } from "~/application/enums/entities/PropertyType";
import { FilterDto } from "~/components/ui/input/InputFilters";
import { EntitiesApi } from "../api/EntitiesApi";
import { EntityWithDetails, findEntityByName, findEntityBySlug, getEntityByPrefix } from "../db/entities/entities.db.server";
import { baseURL } from "../url.server";
import RowFiltersHelper from "./RowFiltersHelper";

// const getEntityFromParams = async (params: Params) => {
//   return await getEntityBySlug(params.entity ?? "");
// };

const validateEntity = async ({
  tenantId,
  name,
  slug,
  order,
  prefix,
  entity,
}: {
  tenantId: string | null;
  name: string;
  slug: string;
  order: number | null;
  prefix: string;
  entity?: Entity;
}) => {
  const errors: string[] = [];

  if (!entity || entity?.name !== name) {
    const existingName = await findEntityByName({ tenantId, name });
    if (existingName) {
      errors.push(`Existing entity with name '${name}': ${existingName.slug}`);
    }
  }

  if (!entity || entity?.slug !== slug) {
    const existingSlug = await findEntityBySlug(slug);
    if (existingSlug) {
      errors.push(`Existing entity with slug '${slug}': ${existingSlug.slug}`);
    }
  }

  // if (order) {
  //   if (!entity || entity?.order !== order) {
  //     const existingOrder = await getEntityByOrder(order);
  //     if (existingOrder) {
  //       errors.push(`Existing entity with order '${order}':  ${existingOrder.slug}`);
  //     }
  //   }
  // }

  if (!entity || entity?.prefix !== prefix) {
    const existingPrefix = await getEntityByPrefix(prefix);
    if (existingPrefix) {
      errors.push(`Existing entity with prefix '${prefix}': ${existingPrefix.slug}`);
    }
  }

  return errors;
};

const getFieldTitle = (field: Property, _ = false): string => {
  switch (field.type) {
    // case PropertyType.USER:
    // case PropertyType.ROLE:
    // case PropertyType.ID:
    //   if (isDefault) {
    //     return "entities.defaultFields." + PropertyType[field.type];
    //   } else {
    //     return "entities.fields." + PropertyType[field.type];
    //   }
    default:
      return field.title;
  }
};

function getFilters({ t, entity, pagination }: { t: TFunction; entity: EntityWithDetails; pagination?: PaginationDto }) {
  const filters: FilterDto[] = [
    ...entity.properties
      .filter((f) => RowFiltersHelper.isPropertyFilterable(f))
      .map((item) => {
        const filter: FilterDto = {
          name: item.name,
          title: t(item.title),
          options: item.options?.map((option) => {
            return {
              color: option.color,
              name: option.name ?? option.value,
              value: option.value,
            };
          }),
          isBoolean: item.type === PropertyType.BOOLEAN,
          hideSearch: item.type === PropertyType.BOOLEAN,
        };
        return filter;
      }),
  ];
  if (entity.tags.length > 0) {
    filters.push({
      name: "tag",
      title: t("models.tag.plural"),
      options: entity.tags.map((tag) => {
        return {
          color: tag.color,
          name: tag.value,
          value: tag.value,
        };
      }),
    });
  }
  if (entity.workflowStates.length > 0) {
    filters.push({
      name: "workflowState",
      title: t("models.workflowState.object"),
      options: entity.workflowStates.map((workflowState) => {
        return {
          color: workflowState.color,
          name: t(workflowState.title),
          value: workflowState.name,
        };
      }),
    });
  }
  // if (pagination) {
  //   filters.push({
  //     hideSearch: true,
  //     name: "pageSize",
  //     title: t("shared.pageSize"),
  //     options: [
  //       { name: "5", value: "5" },
  //       { name: "10", value: "10" },
  //       { name: "25", value: "25" },
  //       { name: "50", value: "50" },
  //       { name: "100", value: "100" },
  //     ],
  //   });
  // }
  return filters;
}

function getRoutes({
  routes,
  entity,
  item,
}: {
  routes?: EntitiesApi.Routes;
  entity: { slug: string; onEdit: string | null };
  item?: Row;
}): EntitiesApi.Routes | undefined {
  if (!routes) {
    return undefined;
  }
  const entityRoutes: EntitiesApi.Routes = {
    list: routes.list?.split(":entity").join(entity.slug),
    new: routes.new?.split(":entity").join(entity.slug),
    overview: routes.overview
      ?.split(":entity")
      .join(entity.slug)
      .replace(":id", item?.id ?? ""),
    edit: routes.edit
      ?.split(":entity")
      .join(entity.slug)
      .replace(":id", item?.id ?? ""),
    import: routes.import?.split(":entity").join(entity.slug),
    export: routes.export?.split(":entity").join(entity.slug),
    publicUrl: routes.publicUrl
      ?.split(":entity")
      .join(entity.slug)
      .replace(":id", item?.id ?? ""),
    group: routes.group?.split(":entity").join(entity.slug),
  };
  if (entity.onEdit === "overviewRoute") {
    entityRoutes.edit = entityRoutes.overview + "?editing";
  } else if (entity.onEdit === "overviewAlwaysEditable") {
    entityRoutes.edit = entityRoutes.overview + "?editing";
  }
  return entityRoutes;
}

function getNoCodeRoutes({ request, params }: { request: Request; params: Params }): EntitiesApi.Routes {
  const url = new URL(request.url);

  if (params.group) {
    if (url.pathname.startsWith(`/admin/g`)) {
      const routes: EntitiesApi.Routes = {
        list: `/admin/g/${params.group}/:entity`,
        new: `/admin/g/${params.group}/:entity/new`,
        overview: `/admin/g/${params.group}/:entity/:id`,
        edit: `/admin/g/${params.group}/:entity/:id/edit`,
        import: `/admin/g/${params.group}/:entity/import`,
        export: `/admin/g/${params.group}/:entity/export`,
        publicUrl: baseURL + `/public/:entity/:id`,
        group: `/admin/g/${params.group}`,
      };
      return routes;
    } else if (url.pathname.startsWith(`/app/${params.tenant}/g`)) {
      const routes: EntitiesApi.Routes = {
        list: `/app/${params?.tenant}/g/${params.group}/:entity`,
        new: `/app/${params?.tenant}/g/${params.group}/:entity/new`,
        overview: `/app/${params?.tenant}/g/${params.group}/:entity/:id`,
        edit: `/app/${params?.tenant}/g/${params.group}/:entity/:id/edit`,
        import: `/app/${params?.tenant}/g/${params.group}/:entity/import`,
        export: `/app/${params?.tenant}/g/${params.group}/:entity/export`,
        publicUrl: baseURL + `/public/:entity/:id`,
        group: `/app/${params?.tenant}/g/${params.group}`,
      };
      return routes;
    }
  } else if (url.pathname.startsWith(`/admin/crm`)) {
    const routes: EntitiesApi.Routes = {
      list: `/admin/crm/:entity`,
      new: `/admin/crm/:entity/new`,
      overview: `/admin/crm/:entity/:id`,
      edit: `/admin/crm/:entity/:id/edit`,
      import: `/admin/crm/:entity/import`,
      export: `/admin/crm/:entity/export`,
      publicUrl: baseURL + `/public/:entity/:id`,
    };
    return routes;
  } else if (url.pathname.startsWith("/admin/")) {
    const routes: EntitiesApi.Routes = {
      list: `/admin/entities/:entity/no-code/:entity`,
      new: `/admin/entities/:entity/no-code/:entity/new`,
      overview: `/admin/entities/:entity/no-code/:entity/:id`,
      edit: `/admin/entities/:entity/no-code/:entity/:id/edit`,
      import: `/admin/entities/:entity/no-code/:entity/import`,
      export: `/admin/entities/:entity/no-code/:entity/export`,
      publicUrl: baseURL + `/public/:entity/:id`,
    };
    return routes;
  } else if (url.pathname.startsWith(`/app/${params?.tenant}/crm`)) {
    const routes: EntitiesApi.Routes = {
      list: `/app/${params?.tenant}/crm/:entity`,
      new: `/app/${params?.tenant}/crm/:entity/new`,
      overview: `/app/${params?.tenant}/crm/:entity/:id`,
      edit: `/app/${params?.tenant}/crm/:entity/:id/edit`,
      import: `/app/${params?.tenant}/crm/:entity/import`,
      export: `/app/${params?.tenant}/crm/:entity/export`,
      publicUrl: baseURL + `/public/:entity/:id`,
    };
    return routes;
  }
  const routes: EntitiesApi.Routes = {
    list: `/app/${params?.tenant}/:entity`,
    new: `/app/${params?.tenant}/:entity/new`,
    overview: `/app/${params?.tenant}/:entity/:id`,
    edit: `/app/${params?.tenant}/:entity/:id/edit`,
    import: `/app/${params?.tenant}/:entity/import`,
    export: `/app/${params?.tenant}/:entity/export`,
    publicUrl: baseURL + `/public/:entity/:id`,
  };
  return routes;
}

// function getAdminNoCodeRoutes(): EntitiesApi.Routes {
//   const routes: EntitiesApi.Routes = {
//     list: `/admin/entities/:entity/no-code/:entity`,
//     new: `/admin/entities/:entity/no-code/:entity/new`,
//     overview: `/admin/entities/:entity/no-code/:entity/:id`,
//     edit: `/admin/entities/:entity/no-code/:entity/:id/edit`,
//     import: `/admin/entities/:entity/no-code/:entity/import`,
//     publicUrl: baseURL + `/public/:entity/:id`,
//   };
//   return routes;
// }

// function getTenantNoCodeRoutes(tenant: string): EntitiesApi.Routes {
//   const routes: EntitiesApi.Routes = {
//     list: `/app/${tenant}/:entity`,
//     new: `/app/${tenant}/:entity/new`,
//     overview: `/app/${tenant}/:entity/:id`,
//     edit: `/app/${tenant}/:entity/:id/edit`,
//     import: `/app/${tenant}/:entity/import`,
//     publicUrl: baseURL + `/public/:entity/:id`,
//   };
//   return routes;
// }

export default {
  validateEntity,
  // getEntityFromParams,
  getFieldTitle,
  getFilters,
  getRoutes,
  getNoCodeRoutes,
  // getAdminNoCodeRoutes,
  // getTenantNoCodeRoutes,
};
