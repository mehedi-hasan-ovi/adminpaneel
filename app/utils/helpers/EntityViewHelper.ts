import { EntityView } from "@prisma/client";
import { PropertyType } from "~/application/enums/entities/PropertyType";
import { ViewFilterCondition } from "~/application/enums/entities/ViewFilterCondition";
import { EntityWithDetails } from "../db/entities/entities.db.server";
import { getEntityViewByName, getEntityViews, getEntityViewDefault } from "../db/entities/entityViews.db.server";
import { GridLayoutDto } from "~/application/dtos/layout/GridLayoutDto";

const getCurrentEntityView = async (entityId: string, urlParams: URLSearchParams) => {
  const name = urlParams.get("v");
  if (name) {
    return await getEntityViewByName({ entityId, name, isSystem: false });
  } else {
    return await getEntityViewDefault({ entityId, isSystem: false });
  }
};

const validateEntityView = async ({
  entityId,
  isDefault,
  name,
  title,
  order,
  entityView,
  userId,
}: {
  entityId: string;
  isDefault: boolean;
  name: string;
  title: string;
  order: number | null;
  entityView?: EntityView;
  userId: string | null;
}) => {
  const errors: string[] = [];

  const views = await getEntityViews(entityId);
  if (isDefault && userId) {
    const defaultView = views.find((f) => f.id !== entityView?.id && f.isDefault && f.userId === userId);
    if (defaultView) {
      errors.push(`Existing default entity view with title: ${defaultView.title}`);
    }
  }

  if (!entityView || entityView?.name !== name) {
    const existingName = views.find((f) => f.id !== entityView?.id && f.name.toLowerCase() === name.toLowerCase());
    if (existingName) {
      errors.push(`Existing entity view with name: ${existingName.name}`);
    }
  }

  if (!entityView || entityView?.title !== title) {
    const existingTitle = views.find((f) => f.id !== entityView?.id && f.title.toLowerCase() === title.toLowerCase());
    if (existingTitle) {
      errors.push(`Existing entity view with title: ${existingTitle.title}`);
    }
  }

  // if (order) {
  //   if (!entityView || entityView?.order !== order) {
  //     const existingOrder = await getEntityViewByOrder(entityId, order);
  //     if (existingOrder) {
  //       errors.push(`Existing entity view with order '${order}':  ${existingOrder.title}`);
  //     }
  //   }
  // }

  return errors;
};

const validateGroupBy = async (entity: EntityWithDetails, layout: string, groupBy: string | undefined, groupByPropertyId: string | undefined) => {
  if (layout !== "board") {
    return [];
  }

  const errors: string[] = [];
  if (groupBy === "byWorkflowStates" && entity.workflowStates.length === 0) {
    errors.push(`Cannot save a Board view without workflow states`);
  } else if (groupBy === "byProperty") {
    const property = entity.properties.find((p) => p.id === groupByPropertyId);
    if (!property || property.type !== PropertyType.SELECT) {
      errors.push(`Cannot save a Board view without a SELECT property`);
    }
  }

  return errors;
};

function getCondition(condition: string) {
  switch (condition) {
    case "equals":
      return ViewFilterCondition.equals;
    case "contains":
      return ViewFilterCondition.contains;
    case "lt":
      return ViewFilterCondition.lt;
    case "lte":
      return ViewFilterCondition.lte;
    case "gt":
      return ViewFilterCondition.gt;
    case "gte":
      return ViewFilterCondition.gte;
    case "startsWith":
      return ViewFilterCondition.startsWith;
    case "endsWith":
      return ViewFilterCondition.endsWith;
    case "in":
      return ViewFilterCondition.in;
    case "notIn":
      return ViewFilterCondition.notIn;
    default:
      return ViewFilterCondition.equals;
  }
}

function getGridLayout(view: EntityView | null): GridLayoutDto {
  const layout: GridLayoutDto = {
    columns: view?.gridColumns ?? 5,
    sm: view?.gridColumnsSm ?? 2,
    md: view?.gridColumnsMd ?? 3,
    lg: view?.gridColumnsLg ?? 4,
    xl: view?.gridColumnsXl ?? 5,
    xl2: view?.gridColumns2xl ?? 6,
    gap: (view?.gridGap ?? "sm") as "xs" | "sm" | "md" | "lg" | "xl",
  };
  return layout;
}

function getType(view: EntityView): "default" | "tenant" | "user" | "system" {
  if (view.isSystem) {
    return "system";
  } else if (view.tenantId && !view.userId) {
    return "tenant";
  } else if (view.tenantId && view.userId) {
    return "user";
  } else if (!view.tenantId && !view.userId) {
    return "default";
  }
  return "default";
}

export default {
  getCurrentEntityView,
  validateEntityView,
  validateGroupBy,
  getCondition,
  getGridLayout,
  getType,
};
