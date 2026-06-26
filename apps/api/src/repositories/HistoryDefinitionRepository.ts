import { PrismaClient, Prisma } from '@prisma/client';
import { IHistoryDefinitionRepository } from '../interfaces';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export const historyDefinitionInclude = {
  intentDefinitions: true,
  characters: {
    include: {
      clueRevealRules: {
        include: { clue: true, triggerIntents: true, requiredClues: true },
      },
      secrets: {
        include: {
          revealStages: {
            include: {
              triggerIntents: true,
              requiredClues: true,
              revealedClues: true,
            },
          },
        },
      },
    },
  },
  locations: { include: { ambientClues: true } },
  objects: {
    include: {
      clueRevealRules: {
        include: { clue: true, triggerIntents: true, requiredClues: true },
      },
    },
  },
  clues: true,
  conclusion: { include: { fields: { include: { options: true } } } },
  endings: { include: { requiredClues: true } },
} satisfies Prisma.HistoryInclude;

export type HistoryWithDefinitions = Prisma.HistoryGetPayload<{
  include: typeof historyDefinitionInclude;
}>;

export const historyCatalogSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  teaser: true,
  genre: true,
  estimatedDurationMinutes: true,
  coverImageUrl: true,
  thumbnailUrl: true,
} satisfies Prisma.HistorySelect;

export type HistoryCatalogItem = Prisma.HistoryGetPayload<{
  select: typeof historyCatalogSelect;
}>;

export class HistoryDefinitionRepository
  extends BaseRepository
  implements IHistoryDefinitionRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(
    historyId: string,
    tx?: PrismaTransaction
  ): Promise<HistoryWithDefinitions | null> {
    const client = tx ?? this.prisma;
    return client.history.findFirst({
      where: { id: historyId, deletedAt: null },
      include: historyDefinitionInclude,
    });
  }

  async findBySlug(
    slug: string,
    tx?: PrismaTransaction
  ): Promise<HistoryWithDefinitions | null> {
    const client = tx ?? this.prisma;
    return client.history.findFirst({
      where: { slug, deletedAt: null },
      include: historyDefinitionInclude,
    });
  }

  async list(tx?: PrismaTransaction): Promise<HistoryWithDefinitions[]> {
    const client = tx ?? this.prisma;
    return client.history.findMany({
      where: { deletedAt: null },
      include: historyDefinitionInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async listPublished(): Promise<HistoryCatalogItem[]> {
    return this.prisma.history.findMany({
      where: { status: 'published', deletedAt: null },
      select: historyCatalogSelect,
      orderBy: { createdAt: 'asc' },
    });
  }
}
