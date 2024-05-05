const models = [
  { name: "OpenAI API - GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  { name: "OpenAI API - GPT-4", value: "gpt-4" },
  { name: "LangChain - GPT-3.5 Turbo", value: "langchain-gpt-3.5-turbo" },
  { name: "LangChain - GPT-4", value: "langchain-gpt-4" },
] as const;
export type AIModel = (typeof models)[number]["value"];
export const OpenAIDefaults = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 0,
  models,
  getModelName: (model: string) => {
    return model.replace("langchain-", "");
  },
  getModelProvider: (model: string) => {
    if (model.startsWith("langchain")) {
      return "LangChain";
    } else {
      return "OpenAI";
    }
  },
};
