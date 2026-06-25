import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  HistoryDefinitionRepository,
  historyDefinitionInclude,
  HistoryWithDefinitions,
} from '../HistoryDefinitionRepository';

const mockHistory = (
  overrides: Partial<HistoryWithDefinitions> = {}
): HistoryWithDefinitions =>
  ({
    id: 'history-1',
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
  }) as HistoryWithDefinitions;

describe('HistoryDefinitionRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: HistoryDefinitionRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new HistoryDefinitionRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findDefault', () => {
    it('returns the first non-deleted history ordered by createdAt asc', async () => {
      const history = mockHistory();
      prisma.history.findFirst.mockResolvedValue(history);

      const result = await repo.findDefault();

      expect(result).toEqual(history);
      expect(prisma.history.findFirst).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: historyDefinitionInclude,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns null when no history exists', async () => {
      prisma.history.findFirst.mockResolvedValue(null);

      const result = await repo.findDefault();

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds a non-deleted history by id with all definitions', async () => {
      const history = mockHistory();
      prisma.history.findFirst.mockResolvedValue(history);

      const result = await repo.findById('history-1');

      expect(result).toEqual(history);
      expect(prisma.history.findFirst).toHaveBeenCalledWith({
        where: { id: 'history-1', deletedAt: null },
        include: historyDefinitionInclude,
      });
    });

    it('returns null when history is not found', async () => {
      prisma.history.findFirst.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('finds a non-deleted history by slug with all definitions', async () => {
      const history = mockHistory();
      prisma.history.findFirst.mockResolvedValue(history);

      const result = await repo.findBySlug('o-bilhete-na-mesa-7');

      expect(result).toEqual(history);
      expect(prisma.history.findFirst).toHaveBeenCalledWith({
        where: { slug: 'o-bilhete-na-mesa-7', deletedAt: null },
        include: historyDefinitionInclude,
      });
    });

    it('returns null when slug is not found', async () => {
      prisma.history.findFirst.mockResolvedValue(null);

      const result = await repo.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('returns all non-deleted histories ordered by createdAt asc', async () => {
      const histories = [
        mockHistory({ id: 'history-1' }),
        mockHistory({ id: 'history-2' }),
      ];
      prisma.history.findMany.mockResolvedValue(histories);

      const result = await repo.list();

      expect(result).toEqual(histories);
      expect(prisma.history.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: historyDefinitionInclude,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns empty array when no histories exist', async () => {
      prisma.history.findMany.mockResolvedValue([]);

      const result = await repo.list();

      expect(result).toEqual([]);
    });
  });
});
