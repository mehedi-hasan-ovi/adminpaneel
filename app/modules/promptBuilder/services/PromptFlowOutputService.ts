import { RowsApi } from "~/utils/api/RowsApi";
import { PromptFlowExecutionWithResults } from "../db/promptExecutions.db.server";
import { getPromptFlowOutputs } from "../db/promptFlowOutputs.db.server";
import { PromptFlowWithDetails } from "../db/promptFlows.db.server";
import { PromptFlowOutputType } from "../dtos/PromptFlowOutputType";
import RowHelper from "~/utils/helpers/RowHelper";
import { getAllEntities, getEntityById } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { PromptFlowOutputResultDto } from "../dtos/PromptFlowOutputResultDto";
import EntityHelper from "~/utils/helpers/EntityHelper";
import { Params } from "@remix-run/react";
import PromptFlowOutputUtils from "../utils/PromptFlowOutputUtils";
import RowValueHelper, { RowValueUpdateDto } from "~/utils/helpers/RowValueHelper";
import { PropertyType } from "~/application/enums/entities/PropertyType";

async function executeOutputs({
  request,
  params,
  flowExecution,
  toRows,
  session,
}: {
  request: Request;
  params: Params;
  flowExecution: PromptFlowExecutionWithResults;
  toRows?: RowWithDetails[];
  session: { tenantId: string | null; userId?: string } | undefined;
}): Promise<PromptFlowOutputResultDto> {
  const result: PromptFlowOutputResultDto = {
    createdRows: [],
    updatedRows: [],
  };
  const outputs = await getPromptFlowOutputs(flowExecution.flowId);
  const allEntities = await getAllEntities({ tenantId: flowExecution.tenantId });

  await Promise.all(
    outputs.map(async (output) => {
      const title = `${PromptFlowOutputUtils.getOutputTitle(output)} (${output.entity.name})`;
      if (output.mappings.length === 0) {
        throw Error(`No mappings for output: ${title}`);
      }
      let entity = await getEntityById({ id: output.entityId, tenantId: flowExecution.tenantId });
      if (!entity) {
        throw Error(`Could not find entity: ${output.entityId}`);
      }
      const type: PromptFlowOutputType = output.type as PromptFlowOutputType;
      console.log({ mappings: output.mappings });
      try {
        console.log({ type });
        switch (type) {
          case "createRow": {
            const createValues = RowHelper.getRowPropertiesFromForm({
              entity,
              values: output.mappings.map((f) => {
                const value = flowExecution.results.find((r) => r.templateId === f.promptTemplateId);
                return {
                  name: f.property.name,
                  value: value?.error ?? value?.response ?? "",
                };
              }),
            });
            console.log({
              entity,
              tenantId: flowExecution.tenantId,
              userId: flowExecution.userId ?? undefined,
              rowValues: createValues.dynamicProperties.map((f) => {
                return {
                  name: f.property.name,
                  value: f.textValue,
                };
              }),
            });
            const row = await RowsApi.create({
              entity,
              tenantId: flowExecution.tenantId,
              userId: flowExecution.userId ?? undefined,
              rowValues: createValues,
            });
            console.log({ row });

            const routes = EntityHelper.getRoutes({ routes: EntityHelper.getNoCodeRoutes({ request, params }), entity, item: row });

            result.createdRows.push({
              entity,
              row,
              href: routes?.overview ?? "",
            });
            break;
          }
          case "updateCurrentRow": {
            if (!toRows || toRows.length === 0) {
              throw Error(`No rows to update`);
            }
            const row = toRows[0];
            const values: RowValueUpdateDto[] = [];
            output.mappings.forEach((f) => {
              const value = flowExecution.results.find((r) => r.templateId === f.promptTemplateId);
              if (value?.response) {
                if (f.property.type === PropertyType.TEXT) {
                  values.push({
                    name: f.property.name,
                    textValue: value.response,
                  });
                } else if (f.property.type === PropertyType.NUMBER) {
                  values.push({
                    name: f.property.name,
                    numberValue: Number(value.response),
                  });
                } else {
                  throw Error(`Property type not supported: ${PropertyType[f.property.type]}`);
                }
              }
            });
            const item = await RowValueHelper.update({
              entity,
              row,
              values,
              session,
            });
            const routes = EntityHelper.getRoutes({ routes: EntityHelper.getNoCodeRoutes({ request, params }), entity, item });
            result.updatedRows.push({
              entity,
              row,
              href: routes?.overview ?? "",
            });
            break;
          }
          case "createChildRow": {
            if (!toRows || toRows.length === 0) {
              throw Error(`No rows to create child row`);
            }
            const parentRow = toRows[0];
            const parentEntity = allEntities.find((e) => e.id === parentRow.entityId);
            const relationship = entity.parentEntities.find((r) => r.parentId === parentEntity?.id);
            console.log({
              parentEntities: entity.parentEntities.map((f) => {
                return { parent: f.parent.name, child: f.child.name };
              }),
              parentEntity: {
                id: parentEntity?.id,
                name: parentEntity?.name,
              },
              entity: {
                id: entity.id,
                name: entity.name,
              },
            });
            if (!relationship) {
              throw Error(`Could not find relationship for parent row (${parentEntity?.name})`);
            }
            let createValues = RowHelper.getRowPropertiesFromForm({
              entity,
              values: output.mappings.map((f) => {
                const value = flowExecution.results.find((r) => r.templateId === f.promptTemplateId);
                return {
                  name: f.property.name,
                  value: value?.error ?? value?.response ?? "",
                };
              }),
            });
            createValues.parentRows = [
              {
                relationshipId: relationship.id,
                parentId: parentRow.id,
              },
            ];
            const row = await RowsApi.create({
              entity,
              tenantId: flowExecution.tenantId,
              userId: flowExecution.userId ?? undefined,
              rowValues: createValues,
            });

            const routes = EntityHelper.getRoutes({ routes: EntityHelper.getNoCodeRoutes({ request, params }), entity, item: row });
            result.createdRows.push({
              entity,
              row,
              href: routes?.overview ?? "",
            });

            break;
          }
        }
      } catch (e: any) {
        throw Error(`[${title}] ${e.message}`);
      }
    })
  );

  return result;
}

export default {
  executeOutputs,
};
