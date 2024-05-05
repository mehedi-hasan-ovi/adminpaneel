import { OpenAI } from "langchain/llms/openai";

import { ChatMessage } from "langchain/schema";
import { OpenAIDefaults } from "../utils/OpenAIDefaults";

function getClient(config: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean }) {
  return new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    streaming: config.stream,
  });
}

async function createChatCompletion({
  role = "assistant",
  model = OpenAIDefaults.model,
  prompt,
  temperature,
  max_tokens,
  user,
  stream,
}: {
  prompt: string;
  model?: string;
  temperature?: number;
  role?: "user" | "assistant" | "system";
  max_tokens?: number;
  user?: string;
  stream?: boolean;
}): Promise<string[]> {
  console.log({
    model,
    temperature,
    max_tokens,
    stream,
    role,
  });
  const openAi = getClient({
    model,
    temperature,
    max_tokens,
    stream,
  });
  const response = await openAi.call(prompt).catch((reason) => {
    console.log(JSON.stringify({ reason }));
    const message = reason?.response?.data?.error?.message;
    if (message) {
      throw Error(message);
    }
    throw Error(reason);
  });
  return [response];
}

export default {
  createChatCompletion,
};
