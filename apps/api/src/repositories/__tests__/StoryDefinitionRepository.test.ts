import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  StoryDefinitionRepository,
  storyCatalogSelect,
  storyDefinitionInclude,
  StoryWithDefinitions,
} from '../StoryDefinitionRepository';

const mockStory = (
  overrides: Partial<StoryWithDefinitions> = {}
): StoryWithDefinitions =>
  ({
    id: 'story-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    genre: 'mystery',
    estimatedDurationMinutes: 10,
    status: 'draft',
    coverImageUrl: null,
    thumbnailUrl: null,
    opening: 'opening text',
    objective: 'objective text',
    publishedAt: null,
    intentDefinitions: [],
    characters: [],
    locations: [],
    objects: [],
    clues: [],
    conclusion: null,
    endings: [],
    ...overrides,
  }) as StoryWithDefinitions;

describe('StoryDefinitionRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: StoryDefinitionRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new StoryDefinitionRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findById', () => {
    it('finds a non-deleted story by id with all definitions', async () => {
      const story = mockStory();
      prisma.story.findFirst.mockResolvedValue(story);

      const result = await repo.findById('story-1');

      expect(result).toEqual(story);
      expect(prisma.story.findFirst).toHaveBeenCalledWith({
        where: { id: 'story-1', deletedAt: null },
        include: storyDefinitionInclude,
      });
    });

    it('returns null when story is not found', async () => {
      prisma.story.findFirst.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('finds a non-deleted story by slug with all definitions', async () => {
      const story = mockStory();
      prisma.story.findFirst.mockResolvedValue(story);

      const result = await repo.findBySlug('o-bilhete-na-mesa-7');

      expect(result).toEqual(story);
      expect(prisma.story.findFirst).toHaveBeenCalledWith({
        where: { slug: 'o-bilhete-na-mesa-7', deletedAt: null },
        include: storyDefinitionInclude,
      });
    });

    it('returns null when slug is not found', async () => {
      prisma.story.findFirst.mockResolvedValue(null);

      const result = await repo.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('returns all non-deleted histories ordered by createdAt asc', async () => {
      const histories = [
        mockStory({ id: 'story-1' }),
        mockStory({ id: 'story-2' }),
      ];
      prisma.story.findMany.mockResolvedValue(histories);

      const result = await repo.list();

      expect(result).toEqual(histories);
      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: storyDefinitionInclude,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns empty array when no histories exist', async () => {
      prisma.story.findMany.mockResolvedValue([]);

      const result = await repo.list();

      expect(result).toEqual([]);
    });
  });

  describe('listPublished', () => {
    const pagination = { page: 1, limit: 20 };

    it('returns a paginated result of published, featured histories', async () => {
      const histories = [
        {
          id: 'story-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
          subtitle: null,
          teaser: 'teaser',
          genre: 'mystery',
          estimatedDurationMinutes: 10,
          isFree: true,
          coverImageUrl: null,
          thumbnailUrl: null,
        },
      ];
      prisma.story.findMany.mockResolvedValue(histories as never);
      prisma.story.count.mockResolvedValue(1);

      const result = await repo.listPublished(true, pagination);

      expect(result).toEqual({
        items: histories,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: { status: 'published', isFeatured: true, deletedAt: null },
        select: storyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.story.count).toHaveBeenCalledWith({
        where: { status: 'published', isFeatured: true, deletedAt: null },
      });
    });

    it('computes skip from page and limit', async () => {
      prisma.story.findMany.mockResolvedValue([] as never);
      prisma.story.count.mockResolvedValue(0);

      await repo.listPublished(false, { page: 3, limit: 10 });

      expect(prisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('returns empty items and zero totalPages when there are no matches', async () => {
      prisma.story.findMany.mockResolvedValue([] as never);
      prisma.story.count.mockResolvedValue(0);

      const result = await repo.listPublished(false, pagination);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it('adds isFree to the where clause when isFree is true', async () => {
      prisma.story.findMany.mockResolvedValue([] as never);
      prisma.story.count.mockResolvedValue(0);

      await repo.listPublished(true, pagination, true);

      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'published',
          isFeatured: true,
          deletedAt: null,
          isFree: true,
        },
        select: storyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.story.count).toHaveBeenCalledWith({
        where: {
          status: 'published',
          isFeatured: true,
          deletedAt: null,
          isFree: true,
        },
      });
    });

    it('adds isFree to the where clause when isFree is false', async () => {
      prisma.story.findMany.mockResolvedValue([] as never);
      prisma.story.count.mockResolvedValue(0);

      await repo.listPublished(false, pagination, false);

      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: {
          status: 'published',
          isFeatured: false,
          deletedAt: null,
          isFree: false,
        },
        select: storyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('omits isFree from the where clause when isFree is undefined', async () => {
      prisma.story.findMany.mockResolvedValue([] as never);
      prisma.story.count.mockResolvedValue(0);

      await repo.listPublished(true, pagination);

      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: { status: 'published', isFeatured: true, deletedAt: null },
        select: storyCatalogSelect,
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });
});
