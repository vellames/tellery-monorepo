import { PrismaClient, Prisma } from '@prisma/client';
import { IHistoryDefinitionRepository } from '../interfaces';
import {
  buildPaginatedResult,
  paginateSkip,
  PaginatedResult,
  PaginationQuery,
} from '../types/pagination.types';
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
  isFree: true,
  coverImageUrl: true,
  thumbnailUrl: true,
} satisfies Prisma.HistorySelect;

export type HistoryCatalogItem = Prisma.HistoryGetPayload<{
  select: typeof historyCatalogSelect;
}>;

export const historyCatalogDetailSelect = {
  ...historyCatalogSelect,
  opening: true,
  objective: true,
} satisfies Prisma.HistorySelect;

export type HistoryCatalogDetailItem = Prisma.HistoryGetPayload<{
  select: typeof historyCatalogDetailSelect;
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

  async findPublishedById(
    historyId: string
  ): Promise<HistoryCatalogItem | null> {
    return this.prisma.history.findFirst({
      where: { id: historyId, status: 'published', deletedAt: null },
      select: historyCatalogSelect,
    });
  }

  async findPublishedDetailById(
    historyId: string
  ): Promise<HistoryCatalogDetailItem | null> {
    return this.prisma.history.findFirst({
      where: { id: historyId, status: 'published', deletedAt: null },
      select: historyCatalogDetailSelect,
    });
  }

  async listPublished(
    isFeatured: boolean,
    pagination: PaginationQuery,
    isFree?: boolean
  ): Promise<PaginatedResult<HistoryCatalogItem>> {
    const where: Prisma.HistoryWhereInput = {
      status: 'published',
      isFeatured,
      deletedAt: null,
      ...(isFree !== undefined && { isFree }),
    };
    const [items, total] = await Promise.all([
      this.prisma.history.findMany({
        where,
        select: historyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: paginateSkip(pagination),
        take: pagination.limit,
      }),
      this.prisma.history.count({ where }),
    ]);
    return buildPaginatedResult(
      items,
      total,
      pagination.page,
      pagination.limit
    );
  }
}
