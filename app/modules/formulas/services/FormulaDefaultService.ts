import { CreateFormulaDto, createFormula } from "../db/formulas.db.server";
import { FormulaDto } from "../dtos/FormulaDto";

function defaultFormulas(): FormulaDto[] {
  const formulas: FormulaDto[] = [
    {
      name: "Concatenates",
      description: "calculates with texts",
      resultAs: "string",
      calculationTrigger: "NEVER",
      components: [
        { order: 1, type: "variable", value: "text1" },
        { order: 2, type: "operator", value: "CONCAT" },
        { order: 3, type: "variable", value: "text2" },
        { order: 4, type: "operator", value: "CONCAT" },
        { order: 5, type: "variable", value: "text3" },
      ],
    },
    {
      name: "Evaluates Booleans",
      description: "calculates with booleans",
      resultAs: "boolean",
      components: [
        { order: 1, type: "variable", value: "boolean1" },
        { order: 2, type: "operator", value: "AND" },
        { order: 3, type: "variable", value: "boolean2" },
      ],
    },
    {
      name: "Adds Days to Date",
      description: "calculates with dates",
      resultAs: "date",
      components: [
        { order: 1, type: "variable", value: "date" },
        { order: 2, type: "operator", value: "DATE_ADD_DAYS" },
        { order: 3, type: "variable", value: "days" },
      ],
    },
    {
      name: "Assigns Static Value",
      description: "sets static value",
      resultAs: "number",
      components: [{ order: 1, type: "variable", value: "number" }],
    },
    {
      name: "Adds Two Numbers",
      description: "calculates addition with two values",
      resultAs: "number",
      components: [
        { order: 1, type: "variable", value: "number1" },
        { order: 2, type: "operator", value: "ADD" },
        { order: 3, type: "variable", value: "number2" },
      ],
    },
  ];

  return formulas;
}

async function createDefault(formulaName?: string) {
  let toCreate: CreateFormulaDto[] = defaultFormulas().map((f) => ({
    name: f.name,
    description: f.description,
    resultAs: f.resultAs ?? "string",
    calculationTrigger: f.calculationTrigger ?? "NEVER",
    withLogs: false,
    components: f.components,
  }));
  if (formulaName) {
    toCreate = toCreate.filter((t) => t.name === formulaName);
  }

  const createdFormulas = await Promise.all(
    toCreate.map(async (data) => {
      await createFormula(data);
    })
  );

  return createdFormulas;
}

export default {
  defaultFormulas,
  createDefault,
};
