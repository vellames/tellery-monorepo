import fs from 'fs';
import path from 'path';
import {
  PrismaClient,
  ClueImportance,
  ConclusionFieldType,
  EndingType,
  HistoryStatus,
  SecretDefaultStrategy,
} from '@prisma/client';

const prisma = new PrismaClient();

interface OpeningSeed {
  shortText?: string;
  fullText?: string;
  callToAction?: string;
}

interface ObjectiveSeed {
  mainQuestion?: string;
  description?: string;
}

interface IntentSeed {
  id: string;
  description: string;
  examples: string[];
  keywords: string[];
}

interface ClueSeed {
  id: string;
  title: string;
  description: string;
  importance: ClueImportance;
}

interface LocationSeed {
  id: string;
  name: string;
  shortDescription: string;
  imageUrl?: string | null;
  initialDescription: string;
  ambientClueIds: string[];
}

interface CharacterClueRevealRuleSeed {
  clueId: string;
  triggerIntents: string[];
  requiresClueIds?: string[];
  revealText: string;
  responseGuidance: string;
}

interface SecretRevealStageSeed {
  level: number;
  triggerIntents: string[];
  requiresClueIds?: string[];
  revealsClueIds?: string[];
  behavior: string;
  allowedToRevealTruth: boolean;
  sampleResponses?: string[];
}

interface SecretSeed {
  summary: string;
  truth: string;
  defaultStrategy: SecretDefaultStrategy;
  revealStages: SecretRevealStageSeed[];
}

interface CharacterSeed {
  name: string;
  role: string;
  shortDescription: string;
  imageUrl?: string | null;
  personality: string;
  speakingStyle: string;
  publicKnowledge: string[];
  privateKnowledge: string[];
  conversationBoundaries: string[];
  openingLine: string;
  clueRevealRules: CharacterClueRevealRuleSeed[];
  secrets: SecretSeed[];
}

interface ObjectClueRevealRuleSeed {
  clueId: string;
  triggerIntents: string[];
  requiresClueIds?: string[];
  revealText: string;
}

interface ObjectSeed {
  name: string;
  shortDescription: string;
  imageUrl?: string | null;
  locationId: string;
  initialDescription: string;
  clueRevealRules: ObjectClueRevealRuleSeed[];
}

interface ConclusionOptionSeed {
  id: string;
  label: string;
}

interface ConclusionFieldSeed {
  id: string;
  label: string;
  type: ConclusionFieldType;
  options: ConclusionOptionSeed[];
}

interface ConclusionSeed {
  fields: ConclusionFieldSeed[];
}

interface EndingConditionSeed {
  conclusionMatches?: Record<string, string>;
  requiresClueIds?: string[];
}

interface EndingSeed {
  title: string;
  type: EndingType;
  imageUrl?: string | null;
  condition: EndingConditionSeed;
  summary: string;
  epilogue: string;
}

interface HistorySeed {
  slug: string;
  title: string;
  subtitle?: string;
  teaser: string;
  genre: string;
  estimatedDurationMinutes: number;
  status: HistoryStatus;
  isFeatured?: boolean;
  isFree?: boolean;
  coverImageUrl?: string | null;
  thumbnailUrl?: string | null;
  opening: OpeningSeed;
  objective: ObjectiveSeed;
  intentDefinitions: IntentSeed[];
  characters: CharacterSeed[];
  locations: LocationSeed[];
  objects: ObjectSeed[];
  clues: ClueSeed[];
  conclusion: ConclusionSeed;
  endings: EndingSeed[];
}

function readJson<T>(fileName: string): T {
  const filePath = path.resolve(__dirname, '..', '..', '..', 'mocks', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function joinText(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join('\n\n');
}

async function updateExistingImageUrls(
  historyId: string,
  data: HistorySeed
): Promise<void> {
  for (const character of data.characters) {
    await prisma.characterDefinition.updateMany({
      where: { historyId, name: character.name },
      data: { imageUrl: character.imageUrl ?? null },
    });
  }

  for (const location of data.locations) {
    await prisma.locationDefinition.updateMany({
      where: { historyId, name: location.name },
      data: { imageUrl: location.imageUrl ?? null },
    });
  }

  for (const object of data.objects) {
    await prisma.objectDefinition.updateMany({
      where: { historyId, name: object.name },
      data: { imageUrl: object.imageUrl ?? null },
    });
  }

  for (const ending of data.endings) {
    await prisma.endingDefinition.updateMany({
      where: { historyId, type: ending.type },
      data: { imageUrl: ending.imageUrl ?? null },
    });
  }
}

async function seedHistory(fileName: string): Promise<void> {
  const data = readJson<HistorySeed>(fileName);

  const existing = await prisma.history.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    await prisma.history.update({
      where: { slug: data.slug },
      data: {
        status: data.status,
        isFeatured: data.isFeatured ?? false,
        isFree: data.isFree ?? false,
        coverImageUrl: data.coverImageUrl ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
      },
    });

    await updateExistingImageUrls(existing.id, data);

    console.log(
      `History "${data.slug}" already seeded, updated status, isFeatured, isFree and image urls.`
    );
    return;
  }

  const history = await prisma.history.create({
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      teaser: data.teaser,
      genre: data.genre,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      status: data.status,
      isFeatured: data.isFeatured ?? false,
      isFree: data.isFree ?? false,
      coverImageUrl: data.coverImageUrl ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      opening: joinText([
        data.opening.shortText,
        data.opening.fullText,
        data.opening.callToAction,
      ]),
      objective: joinText([
        data.objective.mainQuestion,
        data.objective.description,
      ]),
    },
  });

  const clueIdMap: Record<string, string> = {};
  for (const clue of data.clues) {
    const created = await prisma.clueDefinition.create({
      data: {
        historyId: history.id,
        title: clue.title,
        description: clue.description,
        importance: clue.importance,
      },
    });
    clueIdMap[clue.id] = created.id;
  }

  const intentIdMap: Record<string, string> = {};
  for (const intent of data.intentDefinitions) {
    const created = await prisma.intentDefinition.create({
      data: {
        historyId: history.id,
        description: intent.description,
        examples: intent.examples,
        keywords: intent.keywords,
      },
    });
    intentIdMap[intent.id] = created.id;
  }

  const locationIdMap: Record<string, string> = {};
  for (const location of data.locations) {
    const created = await prisma.locationDefinition.create({
      data: {
        historyId: history.id,
        name: location.name,
        shortDescription: location.shortDescription,
        imageUrl: location.imageUrl ?? null,
        initialDescription: location.initialDescription,
        ambientClues: {
          connect: location.ambientClueIds.map((id) => ({ id: clueIdMap[id] })),
        },
      },
    });
    locationIdMap[location.id] = created.id;
  }

  for (const object of data.objects) {
    const created = await prisma.objectDefinition.create({
      data: {
        historyId: history.id,
        locationId: locationIdMap[object.locationId],
        name: object.name,
        shortDescription: object.shortDescription,
        imageUrl: object.imageUrl ?? null,
        initialDescription: object.initialDescription,
      },
    });

    for (const rule of object.clueRevealRules) {
      await prisma.objectClueRevealRule.create({
        data: {
          objectId: created.id,
          clueId: clueIdMap[rule.clueId],
          triggerIntents: {
            connect: rule.triggerIntents.map((id) => ({ id: intentIdMap[id] })),
          },
          requiredClues: {
            connect: (rule.requiresClueIds ?? []).map((id) => ({
              id: clueIdMap[id],
            })),
          },
          revealText: rule.revealText,
        },
      });
    }
  }

  for (const character of data.characters) {
    const created = await prisma.characterDefinition.create({
      data: {
        historyId: history.id,
        name: character.name,
        role: character.role,
        shortDescription: character.shortDescription,
        imageUrl: character.imageUrl ?? null,
        personality: character.personality,
        speakingStyle: character.speakingStyle,
        publicKnowledge: character.publicKnowledge,
        privateKnowledge: character.privateKnowledge,
        conversationBoundaries: character.conversationBoundaries,
        openingLine: character.openingLine,
      },
    });

    for (const rule of character.clueRevealRules) {
      await prisma.characterClueRevealRule.create({
        data: {
          characterId: created.id,
          clueId: clueIdMap[rule.clueId],
          triggerIntents: {
            connect: rule.triggerIntents.map((id) => ({ id: intentIdMap[id] })),
          },
          requiredClues: {
            connect: (rule.requiresClueIds ?? []).map((id) => ({
              id: clueIdMap[id],
            })),
          },
          revealText: rule.revealText,
          responseGuidance: rule.responseGuidance,
        },
      });
    }

    for (const secret of character.secrets) {
      const createdSecret = await prisma.characterSecret.create({
        data: {
          characterId: created.id,
          summary: secret.summary,
          truth: secret.truth,
          defaultStrategy: secret.defaultStrategy,
        },
      });

      for (const stage of secret.revealStages) {
        await prisma.secretRevealStage.create({
          data: {
            secretId: createdSecret.id,
            level: stage.level,
            triggerIntents: {
              connect: stage.triggerIntents.map((id) => ({
                id: intentIdMap[id],
              })),
            },
            requiredClues: {
              connect: (stage.requiresClueIds ?? []).map((id) => ({
                id: clueIdMap[id],
              })),
            },
            revealedClues: {
              connect: (stage.revealsClueIds ?? []).map((id) => ({
                id: clueIdMap[id],
              })),
            },
            behavior: stage.behavior,
            allowedToRevealTruth: stage.allowedToRevealTruth,
            sampleResponses: stage.sampleResponses ?? [],
          },
        });
      }
    }
  }

  const conclusion = await prisma.conclusionDefinition.create({
    data: { historyId: history.id },
  });

  const fieldIdMap: Record<string, string> = {};
  const optionIdMap: Record<string, string> = {};

  for (const field of data.conclusion.fields) {
    const createdField = await prisma.conclusionField.create({
      data: {
        conclusionId: conclusion.id,
        label: field.label,
        type: field.type,
      },
    });
    fieldIdMap[field.id] = createdField.id;

    for (const option of field.options) {
      const createdOption = await prisma.conclusionOption.create({
        data: { fieldId: createdField.id, label: option.label },
      });
      optionIdMap[option.id] = createdOption.id;
    }
  }

  for (const ending of data.endings) {
    const remappedMatches: Record<string, string> = {};
    for (const [fieldId, optionId] of Object.entries(
      ending.condition.conclusionMatches ?? {}
    )) {
      remappedMatches[fieldIdMap[fieldId] ?? fieldId] =
        optionIdMap[optionId] ?? optionId;
    }

    await prisma.endingDefinition.create({
      data: {
        historyId: history.id,
        title: ending.title,
        type: ending.type,
        imageUrl: ending.imageUrl ?? null,
        conclusionMatches: remappedMatches,
        requiredClues: {
          connect: (ending.condition.requiresClueIds ?? []).map((id) => ({
            id: clueIdMap[id],
          })),
        },
        summary: ending.summary,
        epilogue: ending.epilogue,
      },
    });
  }
}

async function main(): Promise<void> {
  const historyFiles = [
    'o-bilhete-na-mesa-7.json',
    'o-relogio-parado.json',
    'o-quadro-trocado.json',
    'o-testamento-de-heitor.json',
  ];
  for (const fileName of historyFiles) {
    await seedHistory(fileName);
  }
  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
