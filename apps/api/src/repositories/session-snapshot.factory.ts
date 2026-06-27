import { Prisma } from '@prisma/client';
import type { HistoryWithDefinitions } from './HistoryDefinitionRepository';

export type DefinitionIdMap = Record<string, string>;

export function buildSessionRootCreateData(
  history: HistoryWithDefinitions,
  userId: string
): Prisma.HistorySessionUncheckedCreateInput {
  return {
    userId,
    historyId: history.id,
    title: history.title,
    subtitle: history.subtitle,
    teaser: history.teaser,
    opening: history.opening,
    objective: history.objective,
    genre: history.genre,
    coverImageUrl: history.coverImageUrl,
    thumbnailUrl: history.thumbnailUrl,
    estimatedDurationMinutes: history.estimatedDurationMinutes,
    clues: {
      create: history.clues.map((clue) => ({
        clueDefinitionId: clue.id,
        title: clue.title,
        description: clue.description,
        importance: clue.importance,
      })),
    },
    intents: {
      create: history.intentDefinitions.map((intent) => ({
        intentDefinitionId: intent.id,
        description: intent.description,
        examples: intent.examples,
        keywords: intent.keywords,
      })),
    },
    conclusionFields: {
      create:
        history.conclusion?.fields.map((field) => ({
          fieldDefinitionId: field.id,
          label: field.label,
          type: field.type,
          options: {
            create: field.options.map((option) => ({
              optionDefinitionId: option.id,
              label: option.label,
            })),
          },
        })) ?? [],
    },
  };
}

export function buildEndingSnapshots(
  history: HistoryWithDefinitions,
  sessionId: string,
  clueMap: DefinitionIdMap
): Prisma.SessionEndingSnapshotUncheckedCreateInput[] {
  return history.endings.map((ending) => ({
    sessionId,
    endingDefinitionId: ending.id,
    title: ending.title,
    type: ending.type,
    imageUrl: ending.imageUrl,
    summary: ending.summary,
    epilogue: ending.epilogue,
    conclusionMatches: ending.conclusionMatches as Prisma.InputJsonValue,
    requiredClues: {
      connect: ending.requiredClues.map((clue) => ({ id: clueMap[clue.id] })),
    },
  }));
}

export function buildLocationStates(
  history: HistoryWithDefinitions,
  sessionId: string,
  clueMap: DefinitionIdMap
): Prisma.LocationSessionStateUncheckedCreateInput[] {
  return history.locations.map((location) => ({
    sessionId,
    locationDefinitionId: location.id,
    name: location.name,
    shortDescription: location.shortDescription,
    imageUrl: location.imageUrl,
    initialDescription: location.initialDescription,
    ambientClues: {
      connect: location.ambientClues.map((clue) => ({ id: clueMap[clue.id] })),
    },
  }));
}

export function buildObjectStates(
  history: HistoryWithDefinitions,
  sessionId: string,
  clueMap: DefinitionIdMap,
  intentMap: DefinitionIdMap,
  locationMap: DefinitionIdMap
): Prisma.ObjectSessionStateUncheckedCreateInput[] {
  return history.objects.map((object) => ({
    sessionId,
    objectDefinitionId: object.id,
    locationStateId: locationMap[object.locationId] ?? null,
    name: object.name,
    shortDescription: object.shortDescription,
    imageUrl: object.imageUrl,
    initialDescription: object.initialDescription,
    clueRevealRules: {
      create: object.clueRevealRules.map((rule) => ({
        clueId: clueMap[rule.clue.id],
        triggerIntents: {
          connect: rule.triggerIntents.map((intent) => ({
            id: intentMap[intent.id],
          })),
        },
        requiredClues: {
          connect: rule.requiredClues.map((clue) => ({ id: clueMap[clue.id] })),
        },
        revealText: rule.revealText,
      })),
    },
  }));
}

export function buildCharacterStates(
  history: HistoryWithDefinitions,
  sessionId: string,
  clueMap: DefinitionIdMap,
  intentMap: DefinitionIdMap
): Prisma.CharacterSessionStateUncheckedCreateInput[] {
  return history.characters.map((character) => ({
    sessionId,
    characterDefinitionId: character.id,
    name: character.name,
    role: character.role,
    shortDescription: character.shortDescription,
    imageUrl: character.imageUrl,
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    openingLine: character.openingLine,
    publicKnowledge: character.publicKnowledge,
    privateKnowledge: character.privateKnowledge,
    conversationBoundaries: character.conversationBoundaries,
    clueRevealRules: {
      create: character.clueRevealRules.map((rule) => ({
        clueId: clueMap[rule.clue.id],
        triggerIntents: {
          connect: rule.triggerIntents.map((intent) => ({
            id: intentMap[intent.id],
          })),
        },
        requiredClues: {
          connect: rule.requiredClues.map((clue) => ({ id: clueMap[clue.id] })),
        },
        revealText: rule.revealText,
        responseGuidance: rule.responseGuidance,
      })),
    },
    secrets: {
      create: character.secrets.map((secret) => ({
        secretDefinitionId: secret.id,
        summary: secret.summary,
        truth: secret.truth,
        defaultStrategy: secret.defaultStrategy,
        revealStages: {
          create: secret.revealStages.map((stage) => ({
            stageDefinitionId: stage.id,
            level: stage.level,
            triggerIntents: {
              connect: stage.triggerIntents.map((intent) => ({
                id: intentMap[intent.id],
              })),
            },
            requiredClues: {
              connect: stage.requiredClues.map((clue) => ({
                id: clueMap[clue.id],
              })),
            },
            revealsClues: {
              connect: stage.revealedClues.map((clue) => ({
                id: clueMap[clue.id],
              })),
            },
            behavior: stage.behavior,
            allowedToRevealTruth: stage.allowedToRevealTruth,
            sampleResponses: stage.sampleResponses,
          })),
        },
      })),
    },
  }));
}
