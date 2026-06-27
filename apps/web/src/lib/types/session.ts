export interface SessionMessage {
  role: string;
  content: string;
  createdAt: string;
}

export interface SessionClue {
  id: string;
  title: string;
  description: string;
  importance: string;
  discoveredAt: string | null;
}

export interface SessionCharacter {
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

export interface SessionObject {
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

export interface SessionLocation {
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

export interface SessionState {
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
  cluesTotal: number;
  characters: SessionCharacter[];
  objects: SessionObject[];
  locations: SessionLocation[];
}

export interface StartSessionResponse {
  sessionId: string;
}

export interface InteractPayload {
  stateId: string;
  interaction: string;
}

export interface InteractDiscoveredClue {
  id: string;
  title: string;
  description: string;
  reasoning: string;
}

export interface InteractResult {
  id: string;
  stateType: 'character' | 'object' | 'location';
  reply: string | null;
  discoveredClues: InteractDiscoveredClue[];
}
