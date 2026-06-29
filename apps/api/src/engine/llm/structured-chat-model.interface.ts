import { z } from 'zod';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatInvokeContext {
  sessionId?: string;
}

export interface IStructuredChatModel {
  invoke(messages: ChatMessage[], context?: ChatInvokeContext): Promise<string>;
  invokeStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>,
    context?: ChatInvokeContext
  ): Promise<T>;
}
