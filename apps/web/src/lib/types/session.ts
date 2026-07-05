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
  locationId: string | null;
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
  story: {
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
  requiredCluesTotal: number;
  characters: SessionCharacter[];
  objects: SessionObject[];
  locations: SessionLocation[];
  conclusionFields: ConclusionField[];
  ending: SessionEndingState | null;
}

export interface ConclusionField {
  id: string;
  label: string;
  type: string;
  options: ConclusionOption[];
}

export interface ConclusionOption {
  id: string;
  label: string;
}

export interface SessionEndingState {
  snapshot: {
    endingDefinitionId: string;
    title: string;
    type: string;
    imageUrl: string | null;
    summary: string;
    epilogue: string;
  };
  score: SessionScore;
}

export interface SessionScore {
  discoveredClues: number;
  totalClues: number;
  requiredCluesDiscovered: number;
  totalRequiredClues: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface StartSessionResponse {
  sessionId: string;
}

export interface SessionListItem {
  id: string;
  status: string;
  title: string;
  genre: string;
  thumbnailUrl: string | null;
  startedAt: string;
  completedAt: string | null;
  storyId: string;
  endingType: string | null;
}

export interface PaginatedSessions {
  items: SessionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CompletedStoryMap = Record<string, string>;

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

export interface ConclusionResult {
  ending: {
    id: string;
    endingDefinitionId: string;
    title: string;
    type: string;
    imageUrl: string | null;
    summary: string;
    epilogue: string;
  };
  score: SessionScore;
}
