import { PromptFlowWithDetails, getPromptFlow } from "../db/promptFlows.db.server";
import AIService from "~/modules/ai/lib/AIService";
import {
  PromptFlowExecutionWithResults,
  PromptTemplateResultWithTemplate,
  createPromptFlowExecution,
  getPromptFlowExecution,
  updatePromptFlowExecution,
  updatePromptTemplateResult,
} from "../db/promptExecutions.db.server";
import { PromptBuilderDataDto } from "../dtos/PromptBuilterDataDto";
import PromptBuilderVariableService from "./PromptBuilderVariableService";
import { PromptBuilderVariableValueDto } from "../dtos/PromptBuilderVariableValueDto";
import { TimeFunction, timeFake } from "~/modules/metrics/utils/MetricTracker";
import PromptFlowOutputService from "./PromptFlowOutputService";
import { PromptExecutionResultDto } from "../dtos/PromptExecutionResultDto";
import { Params } from "@remix-run/react";
import { PromptFlowOutputResultDto } from "../dtos/PromptFlowOutputResultDto";
import { json } from "@remix-run/node";
import { RowWithDetails, getRowsInIds } from "~/utils/db/entities/rows.db.server";
import { EntityWithDetails, getAllEntities } from "~/utils/db/entities/entities.db.server";

async function executeFlow({
  flow,
  userId,
  tenantId,
  request,
  params,
  data,
  testData,
  isDebugging,
  time,
  model,
  toRows,
  allEntities,
}: {
  flow: PromptFlowWithDetails;
  userId?: string | null;
  tenantId: string | null;
  data: PromptBuilderDataDto[];
  request: Request;
  params: Params;
  testData?: PromptBuilderVariableValueDto[];
  isDebugging?: boolean;
  time?: TimeFunction;
  model?: string;
  toRows?: RowWithDetails[];
  allEntities: EntityWithDetails[];
}): Promise<PromptExecutionResultDto | null> {
  if (!time) {
    time = timeFake;
  }
  // eslint-disable-next-line no-console
  console.log("[Prompts] Executing prompt flow: ", flow.title);

  const { id } = await createPromptFlowExecution({
    flowId: flow.id,
    userId: userId ?? null,
    tenantId,
    status: "pending",
    model: model ?? flow.model,
    results: flow.templates
      .sort((a, b) => a.order - b.order)
      .map((template) => ({
        templateId: template.id,
        order: template.order,
        status: "pending",
        prompt: "",
      })),
  });
  const execution = await getPromptFlowExecution(id);
  if (!execution) {
    throw new Error(`Could not create prompt execution: ${id}`);
  }

  await updatePromptFlowExecution(execution.id, {
    status: "running",
    startedAt: new Date(),
  });

  const startTime = performance.now();
  let toExecute = execution.results.sort((a, b) => a.order - b.order);
  try {
    if (flow.inputEntity) {
      const row = data.find((f) => f.row?.entity.id === flow.inputEntityId);
      if (!row) {
        throw Error("Input required: " + flow.inputEntity.name);
      }
    }

    const results: { response?: string | null; error?: string | null }[] = [];
    let index = 0;
    if (execution.flow.executionType === "sequential") {
      if (index > 0) {
        // wait up to 20 seconds for each prompt previous to the current one
        let waitTime = 0;
        do {
          // eslint-disable-next-line no-console
          console.log("[Prompts] Waiting for previous prompt to finish");

          const previousResult = results[index - 1];
          if (previousResult.response !== undefined) {
            break;
          }
          waitTime += 1000;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } while (waitTime < 20000);
      }

      // eslint-disable-next-line no-console
      console.log("[Prompts] Is sequential");
      for (const templateResult of toExecute) {
        if (!templateResult.template) {
          return null;
        }
        let promptData = data;
        if (index > 0) {
          promptData.push({
            variable: {
              type: "promptFlow",
              name: `promptFlow.results[${index - 1}]`,
            },
            text: results[index - 1].response || "",
          });
          if (testData !== undefined) {
            testData.push({
              type: "promptFlow",
              name: `promptFlow.results[${index - 1}]`,
              value: results[index - 1].response || "",
            });
          }
        }
        // eslint-disable-next-line no-console
        console.log("[Prompts] Running template", {
          name: templateResult.template.title,
          order: templateResult.template.order,
          promptData: promptData.map((f) => {
            return {
              variable: f.variable.name,
              text: f.text,
            };
          }),
        });
        const prompt = await PromptBuilderVariableService.parseVariables(templateResult.template.template, promptData, testData, allEntities);
        const resultResponse = await executeTemplate({ execution, templateResult, prompt, isDebugging, userId, model });
        results.push(resultResponse);
        index++;

        if (resultResponse.error && resultResponse.error.length > 0) {
          throw new Error(`[${templateResult.template.title}] Error: ` + resultResponse.error);
        }
      }
    } else if (execution.flow.executionType === "parallel") {
      // eslint-disable-next-line no-console
      console.log("[Prompts] Is parallel");
      let promptData = data;
      if (index > 0) {
        promptData.push({
          variable: {
            type: "promptFlow",
            name: `promptFlow.results[${index - 1}]`,
          },
          text: results[index - 1].response || "",
        });
        if (testData !== undefined) {
          testData.push({
            type: "promptFlow",
            name: `promptFlow.results[${index - 1}]`,
            value: results[index - 1].response || "",
          });
        }
      }
      // parallel
      await Promise.all(
        toExecute.map(async (templateResult) => {
          if (!templateResult.template) {
            throw new Error("Invalid template result: " + templateResult.id);
          }
          if (index > 0) {
            // wait up to 20 seconds for each prompt previous to the current one
            let waitTime = 0;
            do {
              // eslint-disable-next-line no-console
              console.log("[Prompts] Waiting for previous prompt to finish");

              const previousResult = results[index - 1];
              if (previousResult.response !== undefined) {
                break;
              }
              waitTime += 1000;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } while (waitTime < 20000);
          }
          const prompt = await PromptBuilderVariableService.parseVariables(templateResult.template.template, promptData, testData, allEntities);
          index++;
          return await executeTemplate({ execution, templateResult, prompt, isDebugging, model });
        })
      );
    } else {
      throw new Error(`Invalid execution type: ${execution.flow.executionType}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    await updatePromptFlowExecution(execution.id, {
      status: "success",
      completedAt: new Date(),
      duration,
    });
  } catch (e: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    await updatePromptFlowExecution(execution.id, {
      status: "error",
      error: e.message,
      completedAt: new Date(),
      duration,
    });
  }

  // eslint-disable-next-line no-console
  console.log("[Prompts] Completed prompt flow");

  const executionResult = await getPromptFlowExecution(id);
  let outputResult: PromptFlowOutputResultDto = {
    createdRows: [],
    updatedRows: [],
  };
  if (testData === undefined) {
    console.log("Executing outputs");
    outputResult = await PromptFlowOutputService.executeOutputs({
      request,
      params,
      flowExecution: executionResult!,
      toRows,
      session: {
        tenantId,
        userId: userId || undefined,
      },
    });
    console.log({ outputResult });
  }

  const result: PromptExecutionResultDto = {
    executionResult: executionResult!,
    outputResult,
  };
  return result;
}

async function executeTemplate({
  execution,
  templateResult,
  prompt,
  isDebugging,
  userId,
  model,
}: {
  execution: PromptFlowExecutionWithResults;
  templateResult: PromptTemplateResultWithTemplate;
  prompt: string;
  isDebugging?: boolean;
  userId?: string | null;
  model?: string;
}): Promise<{ response?: string | null; error?: string | null }> {
  if (!templateResult.template) {
    throw new Error(`Could not find template for result: ${templateResult.id}`);
  }
  const result: { response?: string | null; error?: string | null } = {};

  // eslint-disable-next-line no-console
  // console.log(`[Prompts] Running template: ${templateResult.template.title}`);
  await updatePromptTemplateResult(templateResult.id, {
    startedAt: new Date(),
    status: "running",
    prompt,
  });

  let debugging = isDebugging; //|| process.env.NODE_ENV === "development";
  try {
    if (!debugging) {
      // eslint-disable-next-line no-console
      console.log("[Prompts.OpenAIService] Creating chat completion");
      const response = await AIService.createChatCompletion({
        model: model ?? execution.flow.model,
        role: "assistant",
        prompt,
        temperature: Number(templateResult.template.temperature),
        stream: execution.flow.stream,
        max_tokens: templateResult.template?.maxTokens && templateResult.template.maxTokens > 0 ? Number(templateResult.template.maxTokens) : undefined,
        user: userId ?? undefined,
      });
      if (!response || !response.length) {
        throw new Error("No response from OpenAI");
      }
      if (!response[0]) {
        throw new Error("No message in response from OpenAI");
      }
      result.response = response[0];
    } else {
      // wait 1 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result.response = `[Debugging] Template ${templateResult.template?.order}: Skipping OpenAI`;
    }
    // eslint-disable-next-line no-console
    // console.log("[Prompts.OpenAIService.Success] ", result.response);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[Prompts.OpenAIService.Error] ", e.message);
    result.error = e.message;
  }

  await updatePromptTemplateResult(templateResult.id, {
    status: result.error ? "error" : "success",
    completedAt: new Date(),
    response: result.response ?? undefined,
    error: result.error ?? undefined,
  });

  return result;
}

async function runFromForm({
  request,
  params,
  form,
  userId,
  tenantId,
  time,
}: {
  request: Request;
  params: Params;
  form: FormData;
  userId: string | undefined;
  tenantId: string | null;
  time?: TimeFunction;
}) {
  const promptFlowId = form.get("promptFlowId")?.toString() ?? "";
  const flow = await getPromptFlow(promptFlowId);
  if (!flow) {
    throw Error("Invalid prompt flow");
  }
  const variables: { name: string; value: string }[] = form.getAll("variables[]").map((f) => JSON.parse(f.toString()));
  const fromRowIds: { id: string }[] = form.getAll("fromRows[]").map((f) => JSON.parse(f.toString()));
  const toRowIds: { id: string }[] = form.getAll("toRows[]").map((f) => JSON.parse(f.toString()));
  const data: PromptBuilderDataDto[] = [];
  variables.forEach((f) => {
    data.push({ variable: { name: f.name, type: "text" }, text: f.value });
  });
  const fromRows = fromRowIds.length === 0 ? [] : await getRowsInIds(fromRowIds.map((f) => f.id));
  const toRows = toRowIds.length === 0 ? [] : await getRowsInIds(toRowIds.map((f) => f.id));
  const allEntities = await getAllEntities({ tenantId: null });
  fromRows.forEach((row) => {
    const entity = allEntities.find((e) => e.id === row.entityId);
    if (!entity) {
      return;
    }
    data.push({
      variable: {
        name: `row.${entity.name}`,
        type: "row",
      },
      row: { entity, item: row },
    });
    data.push({
      variable: {
        name: "row." + entity.name + ".countOfRows",
        type: "row",
      },
      row: { entity, item: row },
    });
    entity.properties
      .filter((f) => !f.isDefault)
      .forEach((property) => {
        if (!row) {
          return;
        }
        data.push({
          variable: {
            name: "row." + entity.name + "." + property.name,
            type: "row",
          },
          row: {
            entity,
            item: row,
          },
        });
      });

    entity.childEntities.forEach(({ child }) => {
      data.push({
        variable: {
          name: `row.${entity.name}.${child.name}[]`,
          type: "row",
        },
        row: { entity, item: row },
      });
    });
  });
  const promptFlowExecutionResult = await executeFlow({
    flow,
    userId,
    tenantId,
    data,
    time,
    request,
    params,
    toRows,
    allEntities,
  });
  return promptFlowExecutionResult;
}

export default {
  executeFlow,
  runFromForm,
};
