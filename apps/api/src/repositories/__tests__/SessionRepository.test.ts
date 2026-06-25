import { PrismaClient, HistorySession } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  SessionRepository,
  historySessionInclude,
  HistorySessionWithRelations,
} from '../SessionRepository';

const mockSession = (
  overrides: Partial<HistorySession> = {}
): HistorySession =>
  ({
    id: 'session-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    userId: 'user-1',
    historyId: 'history-1',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    opening: 'opening text',
    objective: 'objective text',
    genre: 'mystery',
    coverImageUrl: null,
    thumbnailUrl: null,
    estimatedDurationMinutes: 10,
    status: 'active',
    startedAt: new Date('2026-01-01'),
    completedAt: null,
    ...overrides,
  }) as HistorySession;

const mockSessionWithRelations = (
  overrides: Partial<HistorySessionWithRelations> = {}
): HistorySessionWithRelations =>
  ({
    ...mockSession(),
    clues: [],
    intents: [],
    conclusionFields: [],
    endingSnapshots: [],
    characterStates: [],
    locationStates: [],
    objectStates: [],
    conclusion: null,
    ending: null,
    ...overrides,
  }) as HistorySessionWithRelations;

describe('SessionRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: SessionRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new SessionRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findById', () => {
    it('finds a non-deleted session by id with all relations', async () => {
      const session = mockSessionWithRelations();
      prisma.historySession.findFirst.mockResolvedValue(session);

      const result = await repo.findById('session-1');

      expect(result).toEqual(session);
      expect(prisma.historySession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1', deletedAt: null },
        include: historySessionInclude,
      });
    });

    it('returns null when session is not found', async () => {
      prisma.historySession.findFirst.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('returns all non-deleted sessions ordered by createdAt desc when no userId', async () => {
      const sessions = [
        mockSession({ id: 'session-1' }),
        mockSession({ id: 'session-2' }),
      ];
      prisma.historySession.findMany.mockResolvedValue(sessions);

      const result = await repo.list();

      expect(result).toEqual(sessions);
      expect(prisma.historySession.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by userId when provided', async () => {
      const sessions = [mockSession({ id: 'session-1', userId: 'user-1' })];
      prisma.historySession.findMany.mockResolvedValue(sessions);

      const result = await repo.list('user-1');

      expect(result).toEqual(sessions);
      expect(prisma.historySession.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns empty array when no sessions exist', async () => {
      prisma.historySession.findMany.mockResolvedValue([]);

      const result = await repo.list();

      expect(result).toEqual([]);
    });
  });
});
