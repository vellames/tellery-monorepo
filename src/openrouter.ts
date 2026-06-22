import {
  DEFAULT_MODEL,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
} from "./config";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: ChatMessage;
  }>;
  model: string;
}

interface ModelsResponse {
  data: Array<{
    id: string;
    name: string;
  }>;
}

async function openRouterFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${OPENROUTER_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

export async function chat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<{ reply: string; model: string }> {
  const data = await openRouterFetch<ChatCompletionResponse>(
    "/chat/completions",
    {
      method: "POST",
      body: JSON.stringify({ model, messages }),
    }
  );

  const reply = data.choices[0]?.message?.content;
  if (!reply) {
    throw new Error("OpenRouter returned an empty response");
  }

  return { reply, model: data.model };
}

export async function listModels(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = await openRouterFetch<ModelsResponse>("/models");
  return data.data.map(({ id, name }) => ({ id, name }));
}
