import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { appConfig } from '../../config/app.config';
import {
  ChatMessage,
  IStructuredChatModel,
} from './structured-chat-model.interface';

export class OpenRouterStructuredChatModel implements IStructuredChatModel {
  private readonly chatModel: ChatOpenAI;

  constructor(private readonly model: string) {
    this.chatModel = new ChatOpenAI({
      apiKey: appConfig.openrouter.apiKey,
      model,
      configuration: {
        baseURL: appConfig.openrouter.baseUrl,
      },
    });
  }

  async invokeStructured<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>
  ): Promise<T> {
    console.log('[llm] structured call', {
      model: this.model,
      messageCount: messages.length,
    });

    const structured = this.chatModel.withStructuredOutput(schema);
    return (await structured.invoke(
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
    )) as T;
  }
}
