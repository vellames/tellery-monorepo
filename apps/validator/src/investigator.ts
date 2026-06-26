import { OpenRouterJsonClient, LlmMessage } from './llm-client';
import { SessionStateResponse } from './api-client';

export interface InvestigatorAction {
  done: boolean;
  reasoning: string;
  stateId: string | null;
  message: string | null;
}

export interface PastAction {
  turn: number;
  entityType: string;
  entityName: string;
  message: string;
  reply: string | null;
  discoveredClues: string[];
}

const SYSTEM_PROMPT = `You are an autonomous investigator playing a mystery interactive fiction game over an API.
Your goal is to discover as many clues as possible by talking to characters, inspecting objects and visiting locations.

Each turn you receive:
- The full history of your past actions (what you asked, the replies, which clues each action revealed).
- The current state of every entity (how many clues it holds vs how many you already found, and whether it was visited/inspected).

You must choose ONE action per turn:
- Talk to a character (stateType "character")
- Inspect an object (stateType "object")
- Visit a location (stateType "location" - reveals ambient clues only on the FIRST visit)

Strategy:
- Visit every location first (cheap, deterministic ambient clues). Never revisit a location, it yields nothing after the first visit.
- Then inspect every object at least once, and interrogate every character.
- Cover entities you have NOT interacted with yet BEFORE revisiting anyone. Priority goes to entities with cluesTotal > discoveredClueCount (still hiding clues).
- Use your conversation memory: build on previous answers, press contradictions, ask follow-ups that a previous reply suggested.
- NEVER repeat a message you already sent. If you revisit an entity, take a genuinely new angle based on what you learned.
- Ask in Portuguese (the game language). Be specific and curious, referencing discovered clues when relevant.
- Stop (done=true) only when every entity has been explored AND recent turns stop revealing new clues.

You MUST reply with a single JSON object, nothing else, in this exact shape:
{"done": boolean, "reasoning": string, "stateId": string, "message": string}
- stateId must be one of the ids provided in the state.
- message is what you say/ask (in Portuguese). For a location visit, a short exploratory phrase is enough.
- If done is true, stateId and message may be null.`;

export class Investigator {
  constructor(private readonly llm: OpenRouterJsonClient) {}

  async decide(
    state: SessionStateResponse,
    pastActions: PastAction[]
  ): Promise<InvestigatorAction> {
    const messages: LlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: this.buildUserPrompt(state, pastActions) },
    ];

    const raw = (await this.llm.complete(messages)) as Partial<InvestigatorAction>;

    return {
      done: Boolean(raw.done),
      reasoning: typeof raw.reasoning === 'string' ? raw.reasoning : '',
      stateId: typeof raw.stateId === 'string' ? raw.stateId : null,
      message: typeof raw.message === 'string' ? raw.message : null,
    };
  }

  private buildUserPrompt(
    state: SessionStateResponse,
    pastActions: PastAction[]
  ): string {
    const entities = [
      ...state.characters.map((c) => ({
        stateId: c.id,
        type: 'character',
        name: c.name,
        role: c.role,
        description: c.shortDescription,
        explored: null,
        cluesTotal: c.cluesTotal,
        discoveredClueCount: c.discoveredClues.length,
      })),
      ...state.objects.map((o) => ({
        stateId: o.id,
        type: 'object',
        name: o.name,
        role: null,
        description: o.shortDescription,
        explored: o.inspected,
        cluesTotal: o.cluesTotal,
        discoveredClueCount: o.discoveredClues.length,
      })),
      ...state.locations.map((l) => ({
        stateId: l.id,
        type: 'location',
        name: l.name,
        role: null,
        description: l.shortDescription,
        explored: l.visited,
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
        pastActions: pastActions.map((a) => ({
          turn: a.turn,
          entity: `${a.entityType}/${a.entityName}`,
          message: a.message,
          reply: a.reply,
          revealedClues: a.discoveredClues,
        })),
        conversationSummaries: state.characters
          .filter((c) => c.conversationSummary)
          .map((c) => ({ name: c.name, summary: c.conversationSummary })),
      },
      null,
      2
    );
  }
}
