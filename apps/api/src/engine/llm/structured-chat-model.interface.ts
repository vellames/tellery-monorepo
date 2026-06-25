import { z } from 'zod';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface IStructuredChatModel {
  invokeStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>
  ): Promise<T>;
}
