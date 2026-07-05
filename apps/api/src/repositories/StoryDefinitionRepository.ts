import { PrismaClient, Prisma } from '@prisma/client';
import { IStoryDefinitionRepository } from '../interfaces';
import {
  buildPaginatedResult,
  paginateSkip,
  PaginatedResult,
  PaginationQuery,
} from '../types/pagination.types';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export const storyDefinitionInclude = {
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
} satisfies Prisma.StoryInclude;

export type StoryWithDefinitions = Prisma.StoryGetPayload<{
  include: typeof storyDefinitionInclude;
}>;

export const storyCatalogSelect = {
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
} satisfies Prisma.StorySelect;

export type StoryCatalogItem = Prisma.StoryGetPayload<{
  select: typeof storyCatalogSelect;
}>;

export const storyCatalogDetailSelect = {
  ...storyCatalogSelect,
  opening: true,
  objective: true,
} satisfies Prisma.StorySelect;

export type StoryCatalogDetailItem = Prisma.StoryGetPayload<{
  select: typeof storyCatalogDetailSelect;
}>;

export class StoryDefinitionRepository
  extends BaseRepository
  implements IStoryDefinitionRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(
    storyId: string,
    tx?: PrismaTransaction
  ): Promise<StoryWithDefinitions | null> {
    const client = tx ?? this.prisma;
    return client.story.findFirst({
      where: { id: storyId, deletedAt: null },
      include: storyDefinitionInclude,
    });
  }

  async findBySlug(
    slug: string,
    tx?: PrismaTransaction
  ): Promise<StoryWithDefinitions | null> {
    const client = tx ?? this.prisma;
    return client.story.findFirst({
      where: { slug, deletedAt: null },
      include: storyDefinitionInclude,
    });
  }

  async list(tx?: PrismaTransaction): Promise<StoryWithDefinitions[]> {
    const client = tx ?? this.prisma;
    return client.story.findMany({
      where: { deletedAt: null },
      include: storyDefinitionInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPublishedById(storyId: string): Promise<StoryCatalogItem | null> {
    return this.prisma.story.findFirst({
      where: { id: storyId, status: 'published', deletedAt: null },
      select: storyCatalogSelect,
    });
  }

  async findPublishedDetailById(
    storyId: string
  ): Promise<StoryCatalogDetailItem | null> {
    return this.prisma.story.findFirst({
      where: { id: storyId, status: 'published', deletedAt: null },
      select: storyCatalogDetailSelect,
    });
  }

  async findPublishedDetailBySlug(
    slug: string
  ): Promise<StoryCatalogDetailItem | null> {
    return this.prisma.story.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      select: storyCatalogDetailSelect,
    });
  }

  async listPublished(
    isFeatured: boolean,
    pagination: PaginationQuery,
    isFree?: boolean
  ): Promise<PaginatedResult<StoryCatalogItem>> {
    const where: Prisma.StoryWhereInput = {
      status: 'published',
      isFeatured,
      deletedAt: null,
      ...(isFree !== undefined && { isFree }),
    };
    const [items, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        select: storyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: paginateSkip(pagination),
        take: pagination.limit,
      }),
      this.prisma.story.count({ where }),
    ]);
    return buildPaginatedResult(
      items,
      total,
      pagination.page,
      pagination.limit
    );
  }
}
