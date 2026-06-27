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
  locationId: string | null;
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

export interface ConclusionFieldDto {
  id: string;
  label: string;
  type: string;
  options: { id: string; label: string }[];
}

export interface SessionEndingDto {
  endingDefinitionId: string;
  title: string;
  type: string;
  imageUrl: string | null;
  summary: string;
  epilogue: string;
}

export interface SessionScoreDto {
  discoveredClues: number;
  totalClues: number;
  requiredCluesDiscovered: number;
  totalRequiredClues: number;
  correctAnswers: number;
  totalAnswers: number;
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
    teaser: string;
    opening: string;
    objective: string;
    genre: string;
    coverImageUrl: string | null;
    thumbnailUrl: string | null;
  };
  clues: SessionClueDto[];
  cluesTotal: number;
  requiredCluesTotal: number;
  characters: CharacterStateDto[];
  objects: ObjectStateDto[];
  locations: LocationStateDto[];
  conclusionFields: ConclusionFieldDto[];
  ending: {
    snapshot: SessionEndingDto;
    score: SessionScoreDto;
  } | null;
}

type SessionClue = HistorySessionWithRelations['clues'][number];
type CharacterState = HistorySessionWithRelations['characterStates'][number];

const toClueDto = (clue: SessionClue): SessionClueDto => ({
  id: clue.id,
  title: clue.title,
  description: clue.description,
  importance: clue.importance,
  discoveredAt: clue.discoveredAt,
});

function collectCharacterClues(character: CharacterState): SessionClue[] {
  const ruleClues = character.clueRevealRules.map((rule) => rule.clue);
  const secretClues = character.secrets.flatMap((secret) =>
    secret.revealStages.flatMap((stage) => stage.revealsClues)
  );

  const seen = new Set<string>();
  const distinct: SessionClue[] = [];
  for (const clue of [...ruleClues, ...secretClues]) {
    if (seen.has(clue.id)) continue;
    seen.add(clue.id);
    distinct.push(clue);
  }
  return distinct;
}

const mapMessage = (message: {
  role: string;
  content: string;
  createdAt: Date;
}): SessionMessageDto => ({
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
      teaser: session.teaser,
      opening: session.opening,
      objective: session.objective,
      genre: session.genre,
      coverImageUrl: session.coverImageUrl,
      thumbnailUrl: session.thumbnailUrl,
    },
    clues: session.clues.filter((clue) => clue.discovered).map(toClueDto),
    cluesTotal: session.clues.length,
    requiredCluesTotal: session.clues.filter(
      (clue) => clue.importance === 'required'
    ).length,
    characters: session.characterStates.map((character) => {
      const characterClues = collectCharacterClues(character);
      return {
        id: character.id,
        name: character.name,
        role: character.role,
        shortDescription: character.shortDescription,
        imageUrl: character.imageUrl,
        conversationSummary: character.conversationSummary,
        cluesTotal: characterClues.length,
        discoveredClues: characterClues
          .filter((clue) => clue.discovered)
          .map(toClueDto),
        messages: character.messages.map(mapMessage),
      };
    }),
    objects: session.objectStates.map((object) => ({
      id: object.id,
      name: object.name,
      shortDescription: object.shortDescription,
      imageUrl: object.imageUrl,
      initialDescription: object.initialDescription,
      locationId: object.locationStateId,
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
    conclusionFields: session.conclusionFields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      options: field.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    })),
    ending: session.ending
      ? {
          snapshot: {
            endingDefinitionId:
              session.ending.endingSnapshot.endingDefinitionId,
            title: session.ending.endingSnapshot.title,
            type: session.ending.endingSnapshot.type,
            imageUrl: session.ending.endingSnapshot.imageUrl,
            summary: session.ending.endingSnapshot.summary,
            epilogue: session.ending.endingSnapshot.epilogue,
          },
          score: session.ending.score
            ? {
                discoveredClues: session.ending.score.discoveredClues,
                totalClues: session.ending.score.totalClues,
                requiredCluesDiscovered:
                  session.ending.score.requiredCluesDiscovered,
                totalRequiredClues:
                  session.ending.score.totalRequiredClues,
                correctAnswers: session.ending.score.correctAnswers,
                totalAnswers: session.ending.score.totalAnswers,
              }
            : {
                discoveredClues: session.clues.filter((c) => c.discovered)
                  .length,
                totalClues: session.clues.length,
                requiredCluesDiscovered: session.clues.filter(
                  (c) => c.importance === 'required' && c.discovered
                ).length,
                totalRequiredClues: session.clues.filter(
                  (c) => c.importance === 'required'
                ).length,
                correctAnswers: 0,
                totalAnswers: session.conclusionFields.length,
              },
        }
      : null,
  };
}
