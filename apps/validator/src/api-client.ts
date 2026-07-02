import { ValidatorConfig } from './config';

export interface SessionClue {
  id: string;
  title: string;
  description: string;
  importance: string;
  discoveredAt: string | null;
}

export interface SessionMessage {
  role: string;
  content: string;
  createdAt: string;
}

export interface CharacterStateView {
  id: string;
  name: string;
  role: string;
  shortDescription: string;
  imageUrl: string | null;
  conversationSummary: string | null;
  cluesTotal: number;
  discoveredClues: SessionClue[];
  messages: SessionMessage[];
}

export interface ObjectStateView {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  initialDescription: string;
  inspected: boolean;
  inspectedAt: string | null;
  cluesTotal: number;
  discoveredClues: SessionClue[];
  messages: SessionMessage[];
}

export interface LocationStateView {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  initialDescription: string;
  visited: boolean;
  visitedAt: string | null;
  cluesTotal: number;
  discoveredClues: SessionClue[];
}

export interface SessionStateResponse {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  history: {
    id: string;
    title: string;
    subtitle: string | null;
    teaser: string;
    opening: string;
    objective: string;
    genre: string;
    coverImageUrl: string | null;
    thumbnailUrl: string | null;
  };
  clues: SessionClue[];
  characters: CharacterStateView[];
  objects: ObjectStateView[];
  locations: LocationStateView[];
}

export interface InteractResponse {
  id: string;
  stateType: 'character' | 'object' | 'location';
  reply: string | null;
  detectedIntents: {
    intentId: string;
    description?: string;
    confidence: number;
    reasoning: string;
  }[];
  discoveredClues: {
    id: string;
    title: string;
    description: string;
    reasoning: string;
  }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export class GameApiClient {
  constructor(
    private readonly apiUrl: string,
    private token: string | null = null
  ) {}

  async login(email: string, password: string): Promise<void> {
    const body = await this.request<{ token: string }>('POST', '/users/login', {
      email,
      password,
    });
    this.token = body.token;
  }

  async startSession(historySlug: string): Promise<string> {
    const body = await this.request<{ session: { id: string } }>(
      'POST',
      '/session/start',
      { historySlug },
      true
    );
    return body.session.id;
  }

  async interact(
    sessionId: string,
    stateId: string,
    interaction: string
  ): Promise<InteractResponse> {
    return this.request<InteractResponse>(
      'POST',
      `/session/${sessionId}/interact`,
      { stateId, interaction },
      true
    );
  }

  async getSession(sessionId: string): Promise<SessionStateResponse> {
    return this.request<SessionStateResponse>(
      'GET',
      `/session/${sessionId}`,
      undefined,
      true
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown | undefined,
    auth = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth) {
      if (!this.token) {
        throw new Error('Not authenticated. Call login() first.');
      }
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || !payload.success) {
      throw new Error(
        `API ${method} ${path} failed (${response.status}): ${
          payload.error ?? payload.message ?? 'unknown error'
        }`
      );
    }

    return payload.data;
  }
}

export function createApiClient(config: ValidatorConfig): GameApiClient {
  return new GameApiClient(config.apiUrl);
}
