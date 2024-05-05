import type { ActionArgs } from "@vercel/remix";
import OpenAIService from "~/modules/ai/lib/OpenAIStream";
import { OpenAIDefaults } from "~/modules/ai/utils/OpenAIDefaults";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";

// doesn't work :/
// export const config = {
//   runtime: "edge",
// };

export const action = async ({ request, params }: ActionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "ai.openai.chatgpt");
  const { prompt } = (await time(request.json(), "request.json")) as {
    prompt?: string;
  };

  if (!prompt) {
    return new Response("No prompt in the request", { status: 400, headers: getServerTimingHeader() });
  }

  const stream = await time(
    OpenAIService.chatCompletionStream({
      model: OpenAIDefaults.model,
      messages: [{ role: "assistant", content: prompt }],
      stream: true,
      n: 1,
      temperature: OpenAIDefaults.temperature,
    }),
    "OpenAIService.chatCompletionStream"
  );
  return new Response(stream, { headers: getServerTimingHeader() });
};
