import { OpenRouterJsonClient, LlmMessage } from './llm-client';
import { SessionStateResponse } from './api-client';

export interface InvestigatorAction {
  done: boolean;
  reasoning: string;
  stateId: string | null;
  message: string | null;
}

const SYSTEM_PROMPT = `You are an autonomous investigator playing a mystery interactive fiction game over an API.
Your goal is to discover as many clues as possible by talking to characters, inspecting objects and visiting locations.

Each turn you receive the current session state and must choose ONE action:
- Talk to a character (stateType "character")
- Inspect an object (stateType "object")
- Visit a location (stateType "location")

Strategy:
- Visit locations first to reveal ambient context.
- Interrogate characters and inspect objects, asking probing questions in Portuguese (the game language) based on what you already know.
- Use the discovered clues, conversation summaries and entity descriptions to form specific, curious questions.
- Avoid repeating the same message to the same entity. Vary your approach.
- Stop (done=true) only when you have exhausted productive options or discovered all available clues.

You MUST reply with a single JSON object, nothing else, in this exact shape:
{"done": boolean, "reasoning": string, "stateId": string, "message": string}
- stateId must be one of the ids provided in the state.
- message is what you say/ask (in Portuguese). For a location visit, a short exploratory phrase is enough.
- If done is true, stateId and message may be null.`;

export class Investigator {
  constructor(private readonly llm: OpenRouterJsonClient) {}

  async decide(state: SessionStateResponse): Promise<InvestigatorAction> {
    const messages: LlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: this.buildUserPrompt(state) },
    ];

    const raw = (await this.llm.complete(messages)) as Partial<InvestigatorAction>;

    return {
      done: Boolean(raw.done),
      reasoning: typeof raw.reasoning === 'string' ? raw.reasoning : '',
      stateId: typeof raw.stateId === 'string' ? raw.stateId : null,
      message: typeof raw.message === 'string' ? raw.message : null,
    };
  }

  private buildUserPrompt(state: SessionStateResponse): string {
    const entities = [
      ...state.characters.map((c) => ({
        stateId: c.id,
        type: 'character',
        name: c.name,
        role: c.role,
        description: c.shortDescription,
        inspected: null,
        cluesTotal: c.cluesTotal,
        discoveredClueCount: c.discoveredClues.length,
      })),
      ...state.objects.map((o) => ({
        stateId: o.id,
        type: 'object',
        name: o.name,
        role: null,
        description: o.shortDescription,
        inspected: o.inspected,
        cluesTotal: o.cluesTotal,
        discoveredClueCount: o.discoveredClues.length,
      })),
      ...state.locations.map((l) => ({
        stateId: l.id,
        type: 'location',
        name: l.name,
        role: null,
        description: l.shortDescription,
        inspected: l.visited,
        cluesTotal: l.cluesTotal,
        discoveredClueCount: l.discoveredClues.length,
      })),
    ];

    return JSON.stringify(
      {
        history: {
          title: state.history.title,
          subtitle: state.history.subtitle,
          teaser: state.history.teaser,
          opening: state.history.opening,
          objective: state.history.objective,
        },
        discoveredClueCount: state.clues.length,
        discoveredClues: state.clues.map((c) => ({
          title: c.title,
          description: c.description,
        })),
        entities,
        recentConversationByCharacter: state.characters.map((c) => ({
          name: c.name,
          summary: c.conversationSummary,
          recentMessages: c.messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        })),
      },
      null,
      2
    );
  }
}
