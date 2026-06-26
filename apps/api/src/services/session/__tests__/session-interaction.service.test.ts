import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { StatusCodes } from 'http-status-codes';
import { IntentDetectionService } from '../../../engine/intent/intent-detection.service';
import { ObjectAgent } from '../../../engine/object/object-agent.service';
import { SessionInteractionService } from '../session-interaction.service';
import { ISessionRepository } from '../../../interfaces';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';

describe('SessionInteractionService', () => {
  let sessions: DeepMockProxy<ISessionRepository>;
  let intentDetection: DeepMockProxy<IntentDetectionService>;
  let objectAgent: DeepMockProxy<ObjectAgent>;
  let service: SessionInteractionService;

  const ownerId = 'user-owner';
  const intruderId = 'user-intruder';
  const sessionId = 'session-1';
  const language = 'pt-BR' as SupportedLanguage;

  const intent = {
    id: 'intent-1',
    description: 'accuse',
    examples: ['you did it'],
    keywords: ['accuse'],
  };

  const buildSession = (
    overrides: Partial<HistorySessionWithRelations> = {}
  ): HistorySessionWithRelations =>
    ({
      id: sessionId,
      userId: ownerId,
      intents: [intent],
      clues: [],
      characterStates: [],
      objectStates: [],
      locationStates: [],
      ...overrides,
    }) as unknown as HistorySessionWithRelations;

  beforeEach(() => {
    sessions = mockDeep<ISessionRepository>();
    intentDetection = mockDeep<IntentDetectionService>();
    objectAgent = mockDeep<ObjectAgent>();
    objectAgent.run.mockResolvedValue([]);
    service = new SessionInteractionService(sessions, intentDetection, objectAgent);
  });

  afterEach(() => {
    mockReset(sessions);
    mockReset(intentDetection);
    mockReset(objectAgent);
  });

  const input = { stateId: 'state-1', interaction: 'hello' };

  describe('session resolution', () => {
    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.interact(sessionId, ownerId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSession',
      });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(buildSession({ userId: ownerId }));

      await expect(
        service.interact(sessionId, intruderId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.FORBIDDEN,
        messageKey: 'session:errors.sessionNotOwned',
      });
    });

    it('throws 404 when the state does not exist in the session', async () => {
      sessions.findById.mockResolvedValue(buildSession());

      await expect(
        service.interact(sessionId, ownerId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSessionState',
      });
    });
  });

  describe('intent detection', () => {
    const detected = [
      { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
    ];

    it('detects intents for a character state', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          characterStates: [{ id: input.stateId }] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(result.stateType).toBe('character');
      expect(result.detectedIntents).toEqual(detected);
      expect(objectAgent.run).not.toHaveBeenCalled();
    });

    it('skips intent detection for a location state', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [{ id: input.stateId }] as never,
        })
      );

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(result.stateType).toBe('location');
      expect(intentDetection.detect).not.toHaveBeenCalled();
      expect(result.detectedIntents).toEqual([]);
    });
  });

  describe('object inspection', () => {
    const detected = [
      { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
    ];

    const objectState = {
      id: input.stateId,
      name: 'Bilhete',
      shortDescription: 'um bilhete',
      initialDescription: 'papel dobrado',
      clueRevealRules: [
        {
          clueId: 'clue-1',
          revealText: 'revela a tinta',
          clue: { title: 'Tinta azul', description: 'tinta azulCaneta' },
          triggerIntents: [{ id: 'intent-1' }],
          requiredClues: [],
        },
      ],
    };

    const sessionClues = [
      { id: 'clue-1', title: 'Tinta azul', description: 'tinta azul', discovered: false },
    ];

    it('runs the object agent, persists and returns enriched discovered clues', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: sessionClues as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([
        { clueId: 'clue-1', reasoning: 'a tinta estava visível' },
      ]);

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(objectAgent.run).toHaveBeenCalledWith(
        expect.objectContaining({
          object: expect.objectContaining({ id: input.stateId }),
          detectedIntents: detected,
          discoveredClueIds: [],
        })
      );
      expect(sessions.recordObjectInspection).toHaveBeenCalledWith({
        objectStateId: input.stateId,
        discoveredClueIds: ['clue-1'],
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'object', content: 'revela a tinta' },
        ],
      });
      expect(result.discoveredClues).toEqual([
        {
          id: 'clue-1',
          title: 'Tinta azul',
          description: 'tinta azul',
          reasoning: 'a tinta estava visível',
        },
      ]);
    });

    it('marks the object inspected even when no clue is discovered', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: sessionClues as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([]);

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(sessions.recordObjectInspection).toHaveBeenCalledWith({
        objectStateId: input.stateId,
        discoveredClueIds: [],
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(result.discoveredClues).toEqual([]);
    });

    it('passes already-discovered clue ids to the object agent', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: [
            { id: 'clue-prev', title: 'x', description: 'y', discovered: true },
          ] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([]);

      await service.interact(sessionId, ownerId, input, language);

      expect(objectAgent.run).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredClueIds: ['clue-prev'] })
      );
    });
  });
});
