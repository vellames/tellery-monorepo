import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';

export interface SessionMessageDto {
  role: string;
  content: string;
  createdAt: Date;
}

export interface SessionClueDto {
  id: string;
  title: string;
  description: string;
  importance: string;
  discoveredAt: Date | null;
}

export interface CharacterStateDto {
  id: string;
  name: string;
  role: string;
  shortDescription: string;
  imageUrl: string | null;
  conversationSummary: string | null;
  cluesTotal: number;
  discoveredClues: SessionClueDto[];
  messages: SessionMessageDto[];
}

export interface ObjectStateDto {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  initialDescription: string;
  inspected: boolean;
  inspectedAt: Date | null;
  cluesTotal: number;
  discoveredClues: SessionClueDto[];
  messages: SessionMessageDto[];
}

export interface LocationStateDto {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl: string | null;
  initialDescription: string;
  visited: boolean;
  visitedAt: Date | null;
  cluesTotal: number;
  discoveredClues: SessionClueDto[];
}

export interface SessionStateResponse {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  history: {
    id: string;
    title: string;
    subtitle: string | null;
    opening: string;
    objective: string;
    genre: string;
    coverImageUrl: string | null;
    thumbnailUrl: string | null;
  };
  clues: SessionClueDto[];
  characters: CharacterStateDto[];
  objects: ObjectStateDto[];
  locations: LocationStateDto[];
}

type SessionClue = HistorySessionWithRelations['clues'][number];

const toClueDto = (clue: SessionClue): SessionClueDto => ({
  id: clue.id,
  title: clue.title,
  description: clue.description,
  importance: clue.importance,
  discoveredAt: clue.discoveredAt,
});

const mapMessage = (
  message: { role: string; content: string; createdAt: Date }
): SessionMessageDto => ({
  role: message.role,
  content: message.content,
  createdAt: message.createdAt,
});

export function buildSessionStateResponse(
  session: HistorySessionWithRelations
): SessionStateResponse {
  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    history: {
      id: session.historyId,
      title: session.title,
      subtitle: session.subtitle,
      opening: session.opening,
      objective: session.objective,
      genre: session.genre,
      coverImageUrl: session.coverImageUrl,
      thumbnailUrl: session.thumbnailUrl,
    },
    clues: session.clues
      .filter((clue) => clue.discovered)
      .map(toClueDto),
    characters: session.characterStates.map((character) => ({
      id: character.id,
      name: character.name,
      role: character.role,
      shortDescription: character.shortDescription,
      imageUrl: character.imageUrl,
      conversationSummary: character.conversationSummary,
      cluesTotal: character.clueRevealRules.length,
      discoveredClues: character.clueRevealRules
        .filter((rule) => rule.clue.discovered)
        .map((rule) => toClueDto(rule.clue)),
      messages: character.messages.map(mapMessage),
    })),
    objects: session.objectStates.map((object) => ({
      id: object.id,
      name: object.name,
      shortDescription: object.shortDescription,
      imageUrl: object.imageUrl,
      initialDescription: object.initialDescription,
      inspected: object.inspected,
      inspectedAt: object.inspectedAt,
      cluesTotal: object.clueRevealRules.length,
      discoveredClues: object.clueRevealRules
        .filter((rule) => rule.clue.discovered)
        .map((rule) => toClueDto(rule.clue)),
      messages: object.messages.map(mapMessage),
    })),
    locations: session.locationStates.map((location) => ({
      id: location.id,
      name: location.name,
      shortDescription: location.shortDescription,
      imageUrl: location.imageUrl,
      initialDescription: location.initialDescription,
      visited: location.visited,
      visitedAt: location.visitedAt,
      cluesTotal: location.ambientClues.length,
      discoveredClues: location.ambientClues
        .filter((clue) => clue.discovered)
        .map(toClueDto),
    })),
  };
}
