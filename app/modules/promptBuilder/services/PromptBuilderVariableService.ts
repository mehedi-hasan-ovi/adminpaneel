import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import RowHelper from "~/utils/helpers/RowHelper";
import { PromptBuilderDataDto } from "../dtos/PromptBuilterDataDto";
import { PromptBuilderVariableDto } from "../dtos/PromptBuilderVariableDto";
import { PromptBuilderVariableValueDto } from "../dtos/PromptBuilderVariableValueDto";
import { PropertyType } from "~/application/enums/entities/PropertyType";
import { RowValueMultipleDto } from "~/application/dtos/entities/RowValueMultipleDto";
import { RowValueRangeDto } from "~/application/dtos/entities/RowValueRangeDto";
import DateUtils from "~/utils/shared/DateUtils";
import { RowsApi } from "~/utils/api/RowsApi";

function getPossibleVariables(entities: EntityWithDetails[], upToIdx?: number): PromptBuilderVariableDto[] {
  const variables: PromptBuilderVariableDto[] = [
    { type: "text", name: "text" },
    { type: "tenant", name: "tenant.name" },
    { type: "tenant", name: "tenant.slug" },
    { type: "user", name: "user.email" },
    { type: "user", name: "user.firstName" },
    { type: "user", name: "user.lastName" },
    { type: "user", name: "user.name" },
  ];
  entities.forEach((entity) => {
    entity.properties.forEach((property) => {
      // variables.push({ type: "row", name: `entity.${entity.name}.${property.name}` });
      variables.push({ type: "row", name: `row.${entity.name}.${property.name}` });
    });
  });

  if (upToIdx !== undefined) {
    let promptFlowResults: PromptBuilderVariableDto[] = [];
    for (let index = 0; index < upToIdx; index++) {
      promptFlowResults.push({ type: "promptFlow", name: `promptFlow.results[${index}]` });
    }
    // push to top if any
    if (promptFlowResults.length > 0) {
      variables.unshift(...promptFlowResults);
    }
  }

  return variables;
}

function getUsedVariables(template: string, entities: EntityWithDetails[]): PromptBuilderVariableDto[] {
  const variables = getPossibleVariables(entities);

  const values: PromptBuilderVariableDto[] = [];

  variables.forEach((variable) => {
    const escapedVariableName = variable.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`{{${escapedVariableName}}}`, "g");
    if (regex.test(template)) {
      values.push(variable);
    }
  });

  const allVariables: string[] = [];
  // find every variable within {{}} and escape them, can be "{{row.entity.countOfRows}}"
  const regex = new RegExp(`{{(.*?)}}`, "g");
  let match;
  while ((match = regex.exec(template)) !== null) {
    const variableName = match[1];
    allVariables.push(variableName);
  }

  const nonCatchedVariables = allVariables.filter((f) => !values.find((v) => v.name === f));

  nonCatchedVariables.forEach((nonCatchedVariable) => {
    if (nonCatchedVariable.startsWith("promptFlow.")) {
      return;
    }
    values.push({
      type: "text",
      name: nonCatchedVariable,
    });
  });

  return values;
}

async function parseVariables(
  template: string,
  data: PromptBuilderDataDto[],
  testData: PromptBuilderVariableValueDto[] | undefined,
  allEntities: EntityWithDetails[]
): Promise<string> {
  // const originalTemplate = template;
  let result = template;

  if (testData !== undefined && testData.length > 0) {
    testData.forEach((item) => {
      const escapedVariableName = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`{{${escapedVariableName}}}`, "g");
      if (regex.test(result)) {
        result = result.replace(regex, item.value);
      }
    });
  } else {
    await Promise.all(
      data.map(async (item) => {
        const escapedVariableName = item.variable.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`{{${escapedVariableName}}}`, "g");
        if (regex.test(result)) {
          const value = await getValue(item, allEntities);
          result = result.replace(regex, value);
        }
      })
    );
  }

  // eslint-disable-next-line no-console
  // console.log(`[PromptBuilderService] Original template`, { originalTemplate });
  // eslint-disable-next-line no-console
  // console.log(`[PromptBuilderService] Parsed template`, { parsedTemplate: result });

  return result;
}

async function getValue(item: PromptBuilderDataDto, allEntities: EntityWithDetails[]): Promise<string> {
  let result = "";

  let propertyName = "";
  if (item.variable.type !== "text") {
    const parts = item.variable.name.split(".");
    if (parts.length === 3) {
      propertyName = parts[2];
    } else if (parts.length === 2) {
      propertyName = parts[1];
    } else {
      throw new Error("Invalid variable name: " + item.variable.name);
    }
  }
  console.log({ propertyName });

  switch (item.variable.type) {
    case "text": {
      if (!item.text) {
        throw new Error("Text is required in variable: " + item.variable.name);
      }
      result = item.text;
      break;
    }
    case "promptFlow": {
      if (!item.text) {
        throw new Error("Text is required in variable: " + item.variable.name);
      }
      result = item.text;
      break;
    }
    case "row": {
      if (!item.row) {
        throw new Error("Row is required in variable: " + item.variable.name);
      }
      if (propertyName === "countOfRows") {
        const total = await RowsApi.count({
          entity: { id: item.row.entity.id },
          tenantId: item.row.item.tenantId,
          // userId
        });
        result = total.toString();
      } else if (propertyName.endsWith("[]")) {
        const childRelationship = item.row.entity.childEntities.find((f) => f.child.name === propertyName.replace("[]", ""));
        const parentRelationship = item.row.entity.parentEntities.find((f) => f.parent.name === propertyName.replace("[]", ""));
        if (!childRelationship && !parentRelationship) {
          throw new Error("Invalid relationship name: " + propertyName);
        }
        const lines: string[] = [];
        if (childRelationship) {
          const childEntity = allEntities.find((f) => f.id === childRelationship.childId);
          if (!childEntity) {
            throw new Error("Child entity not found: " + childRelationship.childId);
          }
          const properties = childEntity.properties.filter((f) => !f.isDefault);
          const header = [...properties.map((f) => f.name)];
          lines.push("| " + header.join(" | ") + " |");
          lines.push("| " + header.map(() => "---").join(" | ") + " |");
          const childRows = item.row.item.childRows.filter((f) => f.relationshipId === childRelationship.id);
          for (const childRow of childRows) {
            const row = childRow.child;
            const columns: string[] = [];
            for (const property of properties) {
              const value = RowHelper.getPropertyValue({ entity: childEntity, item: row, property });
              let formattedValue = RowHelper.getFormattedValue(value, property.type);
              // delete new lines
              formattedValue = formattedValue.replace(/(\r\n|\n|\r)/gm, "");
              columns.push(formattedValue);
            }
            lines.push("| " + columns.join(" | ") + " |");
          }
        }
        return "\n" + lines.join("\n") + "\n";
      } else {
        let value = RowHelper.getPropertyValue({ entity: item.row.entity, item: item.row.item, propertyName });
        const property = item.row.entity.properties.find((f) => f.name === propertyName);
        if ([PropertyType.MULTI_SELECT, PropertyType.MULTI_TEXT].includes(property?.type ?? PropertyType.TEXT)) {
          const values = value as RowValueMultipleDto[];
          value = values.map((f) => f.value).join(", ");
        } else if ([PropertyType.RANGE_NUMBER, PropertyType.RANGE_DATE].includes(property?.type ?? PropertyType.TEXT)) {
          const values = value as RowValueRangeDto;
          if (property?.type === PropertyType.RANGE_DATE) {
            value = `${DateUtils.dateYMD(values.dateMin)} - ${DateUtils.dateYMD(values.dateMax)}`;
          } else {
            value = `${values.numberMin} - ${values.numberMax}`;
          }
        }
        result = value?.toString() ?? "";
      }
      break;
    }
    case "tenant": {
      if (!item.tenant) {
        throw new Error("Tenant is required in variable: " + item.variable.name);
      }
      switch (propertyName) {
        case "name":
          result = item.tenant.name;
          break;
        case "slug":
          result = item.tenant.slug;
          break;
        default:
          throw new Error("Invalid property name: " + propertyName);
      }
      break;
    }
    case "user":
      if (!item.user) {
        throw new Error("User is required in variable: " + item.variable.name);
      }
      switch (propertyName) {
        case "email":
          result = item.user.email;
          break;
        case "firstName":
          result = item.user.firstName;
          break;
        case "lastName":
          result = item.user.lastName;
          break;
        case "name":
          result = (item.user.firstName + " " + item.user.lastName).trim();
          break;
        default:
          throw new Error("Invalid property name: " + propertyName);
      }
      break;
  }

  return result;
}

export default {
  getPossibleVariables,
  getUsedVariables,
  parseVariables,
};
