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

    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`OpenRouter did not return valid JSON: ${content}`);
    }
  }
}
