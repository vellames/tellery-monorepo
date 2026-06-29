export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterJsonClient {
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly temperature = 0.7
  ) {}

  async complete(messages: LlmMessage[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `OpenRouter request failed (${response.status}): ${error}`
      );
    }

    const payload = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter returned an empty response.');
    }

    const parsed = this.parseJsonContent(content);
    if (parsed !== undefined) return parsed;

    throw new Error(`OpenRouter did not return valid JSON: ${content}`);
  }

  private parseJsonContent(content: string): unknown | undefined {
    const trimmed = content.trim();

    for (const candidate of [trimmed, this.extractJsonObject(trimmed)]) {
      if (!candidate) continue;

      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private extractJsonObject(content: string): string | undefined {
    const start = content.indexOf('{');
    if (start === -1) return undefined;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < content.length; index += 1) {
      const char = content[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) return content.slice(start, index + 1);
    }

    return undefined;
  }
}
