import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { StatusCodes } from 'http-status-codes';
import { IntentDetectionService } from '../../../engine/intent/intent-detection.service';
import { SessionInteractionService } from '../session-interaction.service';
import { ISessionRepository } from '../../../interfaces';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';

describe('SessionInteractionService', () => {
  let sessions: DeepMockProxy<ISessionRepository>;
  let intentDetection: DeepMockProxy<IntentDetectionService>;
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
      characterStates: [],
      objectStates: [],
      locationStates: [],
      ...overrides,
    }) as unknown as HistorySessionWithRelations;

  beforeEach(() => {
    sessions = mockDeep<ISessionRepository>();
    intentDetection = mockDeep<IntentDetectionService>();
    service = new SessionInteractionService(sessions, intentDetection);
  });

  afterEach(() => {
    mockReset(sessions);
    mockReset(intentDetection);
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

    it('detects intents for a character state and returns them', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          characterStates: [{ id: input.stateId }] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(intentDetection.detect).toHaveBeenCalledWith({
        message: input.interaction,
        language,
        intents: [intent],
      });
      expect(result).toEqual({
        id: input.stateId,
        stateType: 'character',
        detectedIntents: detected,
      });
    });

    it('detects intents for an object state and returns them', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [{ id: input.stateId }] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(result.stateType).toBe('object');
      expect(intentDetection.detect).toHaveBeenCalled();
      expect(result.detectedIntents).toEqual(detected);
    });

    it('skips intent detection for a location state (returns empty)', async () => {
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

    it('skips intent detection when the session has no intents', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          intents: [],
          characterStates: [{ id: input.stateId }] as never,
        })
      );

      const result = await service.interact(sessionId, ownerId, input, language);

      expect(intentDetection.detect).not.toHaveBeenCalled();
      expect(result.detectedIntents).toEqual([]);
    });
  });
});
