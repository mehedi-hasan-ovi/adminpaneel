import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { PromptFlowWithDetails } from "../db/promptFlows.db.server";
import { PromptBuilderVariableDto } from "../dtos/PromptBuilderVariableDto";
import PromptBuilderVariableService from "../services/PromptBuilderVariableService";

function getVariablesNeeded(flow: PromptFlowWithDetails, allEntities: EntityWithDetails[]) {
  const allVariables: PromptBuilderVariableDto[] = [];
  flow.templates.forEach((template) => {
    const variables = PromptBuilderVariableService.getUsedVariables(template.template, allEntities);
    variables.forEach((variable) => {
      if (allVariables.find((f) => f.name === variable.name)) {
        return;
      }
      allVariables.push(variable);
    });
  });
  return allVariables;
}

export default {
  getVariablesNeeded,
};
