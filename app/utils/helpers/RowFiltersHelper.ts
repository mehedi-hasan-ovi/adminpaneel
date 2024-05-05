import { Prisma, Property } from "@prisma/client";
import { FiltersDto } from "~/application/dtos/data/FiltersDto";
import { RowFiltersDto } from "~/application/dtos/data/RowFiltersDto";
import { PropertyType } from "~/application/enums/entities/PropertyType";

const getRowFiltersCondition = (filters?: RowFiltersDto): Prisma.RowWhereInput => {
  let where: Prisma.RowWhereInput = {};
  if (!filters) {
    return {};
  }
  const OR_CONDITIONS: Prisma.RowWhereInput[] = [];
  const AND_CONDITIONS: Prisma.RowWhereInput[] = [];

  const parentEntityFilters = filters.properties.filter((f) => f.parentEntity);
  parentEntityFilters
    .filter((f) => f.value !== undefined)
    .forEach((filter) => {
      if (filter.value === "null") {
        AND_CONDITIONS.push({
          parentRows: {
            none: {},
          },
        });
      } else {
        AND_CONDITIONS.push({
          parentRows: {
            some: {
              parentId: filter.value?.toString(),
            },
          },
        });
      }
    });

  if (filters.query) {
    filters.properties
      .filter((f) => isPropertyFilterable(f.property))
      ?.forEach((field) => {
        if (field.property) {
          if (field.property.isDynamic) {
            OR_CONDITIONS.push(getFilterByDynamicProperty(field.property, filters.query, field.condition));
          } else {
            OR_CONDITIONS.push(getFilterByHardCodedProperty(filters, field.property, filters.query, field.condition));
          }
        }
      });
  }

  filters.properties
    .filter((f) => f.value && isPropertyFilterable(f.property))
    ?.forEach((field) => {
      if (field.property) {
        if (field.property.isDynamic) {
          if (field.match && field.match === "or") {
            OR_CONDITIONS.push(getFilterByDynamicProperty(field.property, field.value, field.condition));
          } else {
            AND_CONDITIONS.push(getFilterByDynamicProperty(field.property, field.value, field.condition));
          }
        } else {
          if (field.match && field.match === "or") {
            OR_CONDITIONS.push(getFilterByHardCodedProperty(filters, field.property, field.value, field.condition));
          } else {
            AND_CONDITIONS.push(getFilterByHardCodedProperty(filters, field.property, field.value, field.condition));
          }
        }
      } else {
        if (field.name === "workflowState") {
          if (field.match && field.match === "or") {
            OR_CONDITIONS.push({ workflowState: { name: { [field.condition ?? "equals"]: field.value } } });
          } else {
            AND_CONDITIONS.push({ workflowState: { name: { [field.condition ?? "equals"]: field.value } } });
          }
        } else if (field.name === "workflowStateId") {
          if (field.match && field.match === "or") {
            OR_CONDITIONS.push({ workflowStateId: field.value });
          } else {
            AND_CONDITIONS.push({ workflowStateId: field.value });
          }
        }
      }
    });

  // console.log({
  //   OR_CONDITIONS,
  //   AND_CONDITIONS,
  // });

  let whereQuery = {};
  let whereFilters = {};
  let whereTags = {};
  if (OR_CONDITIONS.length > 0) {
    whereQuery = {
      OR: [...OR_CONDITIONS],
    };
  }
  if (AND_CONDITIONS.length > 0) {
    whereFilters = {
      AND: [...AND_CONDITIONS],
    };
  }
  if (filters.tags.length > 0) {
    whereTags = {
      tags: {
        some: {
          tag: {
            value: {
              in: filters.tags,
            },
          },
        },
      },
    };
  }

  const andConditions: any[] = [];
  if (OR_CONDITIONS.length > 0) {
    andConditions.push(whereQuery);
  }
  if (AND_CONDITIONS.length > 0) {
    andConditions.push(whereFilters);
  }
  if (filters.tags.length > 0) {
    andConditions.push(whereTags);
  }
  if (andConditions.length > 0) {
    where = {
      AND: andConditions,
    };
  }
  // console.log({ where: JSON.stringify(where) });
  return where;
};

function getFilterByHardCodedProperty(filters: RowFiltersDto, property: Property, value: string | null, condition: string | undefined) {
  if (value === null) {
    return {};
  }
  if (filters.customRow) {
    return {
      [filters.entity.name]: {
        [property.name]: { [condition ?? "contains"]: value },
      },
    };
  } else {
    return { [property.name]: { [condition ?? "contains"]: value } };
  }
}

function getFilterByDynamicProperty(property: Property, value: string | null, condition: string | undefined) {
  let where: Prisma.RowWhereInput = {};
  if (value === null) {
    return where;
  }
  if (property.type === PropertyType.TEXT || property.type === PropertyType.SELECT) {
    where = {
      values: {
        some: {
          propertyId: property.id,
          textValue: {
            [condition ?? "contains"]: value,
          },
        },
      },
    };
  } else if (property.type === PropertyType.BOOLEAN) {
    where = {
      values: {
        some: {
          propertyId: property.id,
          booleanValue: {
            [condition ?? "equals"]: value === "true",
          },
        },
      },
    };
  }
  return where;
}

function isPropertyFilterable(property?: Property) {
  if (!property) {
    return true;
  }
  return (
    property.type === PropertyType.TEXT ||
    property.type === PropertyType.SELECT ||
    property.type === PropertyType.BOOLEAN ||
    property.type === PropertyType.NUMBER
  );
}

const getFiltersCondition = (filters?: FiltersDto) => {
  let where = {};
  if (!filters) {
    return {};
  }
  const queryConditions: any[] = [];
  const AND_CONDITIONS: any[] = [];

  filters.properties
    ?.filter((f) => !f.manual)
    .forEach((field) => {
      if (filters.query && !field.isNumber) {
        queryConditions.push(getPropertyFilter(field.name, filters.query, field.condition, field.isNumber));
      }
    });

  filters.properties
    ?.filter((f) => !f.manual)
    .forEach((field) => {
      if (field.value) {
        AND_CONDITIONS.push(getPropertyFilter(field.name, field.value, field.condition, field.isNumber));
      }
    });

  let whereQuery = {};
  let whereFilters = {};
  if (queryConditions.length > 0) {
    whereQuery = {
      OR: [...queryConditions],
    };
  }
  if (AND_CONDITIONS.length > 0) {
    whereFilters = {
      AND: [...AND_CONDITIONS],
    };
  }

  const andConditions: any[] = [];
  if (queryConditions.length > 0) {
    andConditions.push(whereQuery);
  }
  if (AND_CONDITIONS.length > 0) {
    andConditions.push(whereFilters);
  }
  if (andConditions.length > 0) {
    where = {
      AND: andConditions,
    };
  }
  return where;
};

function getPropertyFilter(name: string, value: string, condition: string | undefined, isNumber: boolean | undefined) {
  if (isNumber) {
    return { [name]: { [condition ?? "contains"]: Number(value) } };
  }
  return { [name]: { [condition ?? "contains"]: value } };
}

function getParam_String(urlSearchParams: URLSearchParams | undefined, names: string[]) {
  for (let idx = 0; idx < names.length; idx++) {
    const text = urlSearchParams?.get(names[idx])?.toString();
    if (text) {
      return urlSearchParams?.get(names[idx])?.toString();
    }
  }
}

function getParam_Number(urlSearchParams: URLSearchParams | undefined, names: string[]) {
  for (let idx = 0; idx < names.length; idx++) {
    const number = getNumber(urlSearchParams?.get(names[idx])?.toString());
    if (number) {
      return number;
    }
  }
}

function getNumber(value?: string) {
  if (value && !isNaN(Number(value)) && Number(value) < 2147483647) {
    return Number(value);
  }
}

export default {
  getRowFiltersCondition,
  getFiltersCondition,
  isPropertyFilterable,
  getParam_String,
  getParam_Number,
};
