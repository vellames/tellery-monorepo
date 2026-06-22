import { ChatOpenAI } from "@langchain/openai";
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

interface ModelsResponse {
  data: Array<{
    id: string;
    name: string;
  }>;
}

export function createOpenRouterChatModel(model: string = DEFAULT_MODEL) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "Missing required environment variable: OPENROUTER_API_KEY"
    );
  }

  return new ChatOpenAI({
    apiKey: OPENROUTER_API_KEY,
    model,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
    },
  });
}

async function openRouterFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "Missing required environment variable: OPENROUTER_API_KEY"
    );
  }

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
  const llm = createOpenRouterChatModel(model);
  const response = await llm.invoke(
    messages.map((message) => [message.role, message.content])
  );

  const reply = Array.isArray(response.content)
    ? response.content
        .map((content) => (typeof content === "string" ? content : ""))
        .join("")
    : response.content;

  if (!reply) {
    throw new Error("OpenRouter returned an empty response");
  }

  return { reply, model };
}

export async function listModels(): Promise<
  Array<{ id: string; name: string }>
> {
  const data = await openRouterFetch<ModelsResponse>("/models");
  return data.data.map(({ id, name }) => ({ id, name }));
}
