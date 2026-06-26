import { PrismaClient, Prisma, HistorySession } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { HistoryWithDefinitions } from '../HistoryDefinitionRepository';
import {
  SessionRepository,
  historySessionInclude,
  HistorySessionWithRelations,
} from '../SessionRepository';

const mockSession = (overrides: Partial<HistorySession> = {}): HistorySession =>
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

  describe('create', () => {
    it('creates the session snapshot in a transaction and returns the full session', async () => {
      const history = {
        id: 'history-1',
        clues: [],
        intentDefinitions: [],
        characters: [],
        locations: [],
        objects: [],
        endings: [],
        conclusion: null,
      } as unknown as HistoryWithDefinitions;
      const fullSession = mockSessionWithRelations();

      prisma.$transaction.mockImplementation(async (cb) =>
        cb(prisma as unknown as Prisma.TransactionClient)
      );
      prisma.historySession.create.mockResolvedValue({
        id: 'session-1',
        clues: [],
        intents: [],
      } as never);
      prisma.historySession.findFirst.mockResolvedValue(fullSession);

      const result = await repo.create({ userId: 'user-1', history });

      expect(result).toEqual(fullSession);
      expect(prisma.historySession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          historyId: 'history-1',
        }),
        include: { clues: true, intents: true },
      });
      expect(prisma.historySession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        include: historySessionInclude,
      });
    });
  });

  describe('recordObjectInspection', () => {
    beforeEach(() => {
      prisma.$transaction.mockImplementation(async (cb) =>
        cb(prisma as unknown as Prisma.TransactionClient)
      );
    });

    it('marks the object inspected, connects revealed clues and marks them discovered', async () => {
      prisma.objectSessionState.update.mockResolvedValue({} as never);
      prisma.sessionClue.updateMany.mockResolvedValue({ count: 2 } as never);

      await repo.recordObjectInspection({
        objectStateId: 'object-state-1',
        discoveredClueIds: ['clue-1', 'clue-2'],
      });

      expect(prisma.objectSessionState.update).toHaveBeenCalledWith({
        where: { id: 'object-state-1' },
        data: expect.objectContaining({
          inspected: true,
          revealedClues: {
            connect: [{ id: 'clue-1' }, { id: 'clue-2' }],
          },
        }),
      });
      expect(prisma.sessionClue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['clue-1', 'clue-2'] } },
        data: expect.objectContaining({ discovered: true }),
      });
    });

    it('marks the object inspected even when no clue is discovered', async () => {
      prisma.objectSessionState.update.mockResolvedValue({} as never);

      await repo.recordObjectInspection({
        objectStateId: 'object-state-1',
        discoveredClueIds: [],
      });

      expect(prisma.objectSessionState.update).toHaveBeenCalledWith({
        where: { id: 'object-state-1' },
        data: expect.objectContaining({
          inspected: true,
          revealedClues: undefined,
        }),
      });
      expect(prisma.sessionClue.updateMany).not.toHaveBeenCalled();
    });
  });
});
