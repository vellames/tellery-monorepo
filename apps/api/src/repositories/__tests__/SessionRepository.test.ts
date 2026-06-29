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
    it('returns paginated sessions ordered by createdAt desc when no userId', async () => {
      const sessions = [
        mockSession({ id: 'session-1' }),
        mockSession({ id: 'session-2' }),
      ];
      prisma.historySession.findMany.mockResolvedValue(sessions);
      prisma.historySession.count.mockResolvedValue(2);

      const result = await repo.list();

      expect(result.items).toEqual(sessions);
      expect(result.total).toBe(2);
      expect(prisma.historySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        })
      );
    });

    it('filters by userId when provided', async () => {
      const sessions = [mockSession({ id: 'session-1', userId: 'user-1' })];
      prisma.historySession.findMany.mockResolvedValue(sessions);
      prisma.historySession.count.mockResolvedValue(1);

      const result = await repo.list('user-1');

      expect(result.items).toEqual(sessions);
      expect(prisma.historySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('returns empty items when no sessions exist', async () => {
      prisma.historySession.findMany.mockResolvedValue([]);
      prisma.historySession.count.mockResolvedValue(0);

      const result = await repo.list();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('respects page and limit for pagination', async () => {
      prisma.historySession.findMany.mockResolvedValue([]);
      prisma.historySession.count.mockResolvedValue(25);

      await repo.list(undefined, 3, 5);

      expect(prisma.historySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
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
      prisma.objectInteractionMessage.createMany.mockResolvedValue({
        count: 3,
      } as never);

      await repo.recordObjectInspection({
        objectStateId: 'object-state-1',
        discoveredClueIds: ['clue-1', 'clue-2'],
        messages: [
          { role: 'user', content: 'olho o bilhete' },
          { role: 'object', content: 'a tinta é azul' },
        ],
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
      expect(prisma.objectInteractionMessage.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            objectStateId: 'object-state-1',
            role: 'user',
            content: 'olho o bilhete',
            createdAt: expect.any(Date),
          }),
          expect.objectContaining({
            objectStateId: 'object-state-1',
            role: 'object',
            content: 'a tinta é azul',
            createdAt: expect.any(Date),
          }),
        ],
      });
    });

    it('marks the object inspected and records the user message even when no clue is discovered', async () => {
      prisma.objectSessionState.update.mockResolvedValue({} as never);

      await repo.recordObjectInspection({
        objectStateId: 'object-state-1',
        discoveredClueIds: [],
        messages: [{ role: 'user', content: 'examinar' }],
      });

      expect(prisma.objectSessionState.update).toHaveBeenCalledWith({
        where: { id: 'object-state-1' },
        data: expect.objectContaining({
          inspected: true,
          revealedClues: undefined,
        }),
      });
      expect(prisma.sessionClue.updateMany).not.toHaveBeenCalled();
      expect(prisma.objectInteractionMessage.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            objectStateId: 'object-state-1',
            role: 'user',
            content: 'examinar',
            createdAt: expect.any(Date),
          }),
        ],
      });
    });
  });

  describe('recordCharacterInteraction', () => {
    beforeEach(() => {
      prisma.$transaction.mockImplementation(async (cb) =>
        cb(prisma as unknown as Prisma.TransactionClient)
      );
    });

    it('advances secrets, appends messages and marks clues discovered', async () => {
      prisma.characterSessionState.update.mockResolvedValue({} as never);
      prisma.characterSecretSessionState.update.mockResolvedValue({} as never);
      prisma.characterConversationMessage.createMany.mockResolvedValue({
        count: 2,
      } as never);
      prisma.sessionClue.updateMany.mockResolvedValue({ count: 1 } as never);

      await repo.recordCharacterInteraction({
        characterStateId: 'char-state-1',
        discoveredClueIds: ['clue-1'],
        updatedSecretStates: [
          {
            secretId: 'secret-1',
            currentStageLevel: 1,
            revealedStageIds: ['stage-1'],
            revealedClueIds: ['clue-secret'],
          },
        ],
        messages: [
          { role: 'user', content: 'oi' },
          { role: 'character', content: 'olá' },
        ],
      });

      expect(prisma.characterSessionState.update).toHaveBeenCalledWith({
        where: { id: 'char-state-1' },
        data: expect.objectContaining({
          revealedClues: { connect: [{ id: 'clue-1' }] },
        }),
      });
      expect(prisma.characterSecretSessionState.update).toHaveBeenCalledWith({
        where: { id: 'secret-1' },
        data: expect.objectContaining({
          currentStageLevel: 1,
          revealStages: { connect: [{ id: 'stage-1' }] },
          revealedClues: { connect: [{ id: 'clue-secret' }] },
        }),
      });
      expect(
        prisma.characterConversationMessage.createMany
      ).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            characterStateId: 'char-state-1',
            role: 'user',
            content: 'oi',
            createdAt: expect.any(Date),
          }),
          expect.objectContaining({
            characterStateId: 'char-state-1',
            role: 'character',
            content: 'olá',
            createdAt: expect.any(Date),
          }),
        ],
      });
      expect(prisma.sessionClue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['clue-1'] } },
        data: expect.objectContaining({ discovered: true }),
      });
    });

    it('persists messages even with no secret advancement', async () => {
      prisma.characterSessionState.update.mockResolvedValue({} as never);
      prisma.characterConversationMessage.createMany.mockResolvedValue({
        count: 2,
      } as never);

      await repo.recordCharacterInteraction({
        characterStateId: 'char-state-1',
        discoveredClueIds: [],
        updatedSecretStates: [],
        messages: [
          { role: 'user', content: 'oi' },
          { role: 'character', content: 'olá' },
        ],
      });

      expect(prisma.characterSecretSessionState.update).not.toHaveBeenCalled();
      expect(prisma.sessionClue.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('recordLlmCall', () => {
    it('persists a single LLM usage row with nano-dollar cost', async () => {
      prisma.llmCall.create.mockResolvedValue({} as never);

      await repo.recordLlmCall({
        sessionId: 'session-1',
        purpose: 'character',
        model: 'deepseek/deepseek-v4-pro',
        promptTokens: 1200,
        completionTokens: 80,
        totalTokens: 1280,
        costUsdNanos: 100_000n,
        latencyMs: 540,
      });

      expect(prisma.llmCall.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          purpose: 'character',
          model: 'deepseek/deepseek-v4-pro',
          promptTokens: 1200,
          completionTokens: 80,
          totalTokens: 1280,
          costUsdNanos: 100_000n,
          latencyMs: 540,
        },
      });
    });

    it('persists without latency when omitted', async () => {
      prisma.llmCall.create.mockResolvedValue({} as never);

      await repo.recordLlmCall({
        sessionId: 'session-1',
        purpose: 'intent',
        model: 'google/gemini-2.5-flash-lite',
        promptTokens: 100,
        completionTokens: 5,
        totalTokens: 105,
        costUsdNanos: 0n,
      });

      expect(prisma.llmCall.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          purpose: 'intent',
          model: 'google/gemini-2.5-flash-lite',
          promptTokens: 100,
          completionTokens: 5,
          totalTokens: 105,
          costUsdNanos: 0n,
        },
      });
    });
  });

  describe('getSessionCost', () => {
    it('aggregates nano-dollar totals and groups per purpose', async () => {
      (prisma.llmCall.aggregate as jest.Mock).mockResolvedValue({
        _sum: { costUsdNanos: 250_000n },
      });
      (prisma.llmCall.groupBy as jest.Mock).mockResolvedValue([
        {
          purpose: 'character',
          _sum: { costUsdNanos: 200_000n },
          _count: { id: 2 },
        },
        {
          purpose: 'intent',
          _sum: { costUsdNanos: 50_000n },
          _count: { id: 1 },
        },
      ]);

      const result = await repo.getSessionCost('session-1');

      expect(prisma.llmCall.aggregate).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        _sum: { costUsdNanos: true },
      });
      expect(prisma.llmCall.groupBy).toHaveBeenCalledWith({
        by: ['purpose'],
        where: { sessionId: 'session-1' },
        _sum: { costUsdNanos: true },
        _count: { id: true },
      });
      expect(result.totalCostUsdNanos).toBe(250_000n);
      expect(result.breakdown).toEqual([
        { purpose: 'character', costUsdNanos: 200_000n, calls: 2 },
        { purpose: 'intent', costUsdNanos: 50_000n, calls: 1 },
      ]);
    });
  });

  describe('recordLocationVisit', () => {
    beforeEach(() => {
      prisma.$transaction.mockImplementation(async (cb) =>
        cb(prisma as unknown as Prisma.TransactionClient)
      );
    });

    it('marks the location visited, connects ambient clues and marks them discovered', async () => {
      prisma.locationSessionState.update.mockResolvedValue({} as never);
      prisma.sessionClue.updateMany.mockResolvedValue({ count: 2 } as never);

      await repo.recordLocationVisit({
        locationStateId: 'location-state-1',
        revealedAmbientClueIds: ['clue-1', 'clue-2'],
        discoveredClueIds: ['clue-1', 'clue-2'],
      });

      expect(prisma.locationSessionState.update).toHaveBeenCalledWith({
        where: { id: 'location-state-1' },
        data: expect.objectContaining({
          visited: true,
          revealedAmbientClues: {
            connect: [{ id: 'clue-1' }, { id: 'clue-2' }],
          },
        }),
      });
      expect(prisma.sessionClue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['clue-1', 'clue-2'] } },
        data: expect.objectContaining({ discovered: true }),
      });
    });

    it('marks the location visited even when it has no ambient clues', async () => {
      prisma.locationSessionState.update.mockResolvedValue({} as never);

      await repo.recordLocationVisit({
        locationStateId: 'location-state-1',
        revealedAmbientClueIds: [],
        discoveredClueIds: [],
      });

      expect(prisma.locationSessionState.update).toHaveBeenCalledWith({
        where: { id: 'location-state-1' },
        data: expect.objectContaining({
          visited: true,
          revealedAmbientClues: undefined,
        }),
      });
      expect(prisma.sessionClue.updateMany).not.toHaveBeenCalled();
    });
  });
});
