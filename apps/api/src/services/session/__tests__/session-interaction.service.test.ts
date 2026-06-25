import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { StatusCodes } from 'http-status-codes';
import { SessionInteractionService } from '../session-interaction.service';
import { ISessionRepository } from '../../../interfaces';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';

describe('SessionInteractionService', () => {
  let sessions: DeepMockProxy<ISessionRepository>;
  let service: SessionInteractionService;

  const ownerId = 'user-owner';
  const intruderId = 'user-intruder';
  const sessionId = 'session-1';

  const buildSession = (
    overrides: Partial<HistorySessionWithRelations> = {}
  ): HistorySessionWithRelations =>
    ({
      id: sessionId,
      userId: ownerId,
      characterStates: [],
      objectStates: [],
      locationStates: [],
      ...overrides,
    }) as unknown as HistorySessionWithRelations;

  beforeEach(() => {
    sessions = mockDeep<ISessionRepository>();
    service = new SessionInteractionService(sessions);
  });

  afterEach(() => {
    mockReset(sessions);
  });

  const input = { stateId: 'state-1', interaction: 'hello' };

  describe('session resolution', () => {
    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.interact(sessionId, ownerId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSession',
      });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(buildSession({ userId: ownerId }));

      await expect(
        service.interact(sessionId, intruderId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.FORBIDDEN,
        messageKey: 'session:errors.sessionNotOwned',
      });
    });

    it('throws 404 when the state does not exist in the session', async () => {
      sessions.findById.mockResolvedValue(buildSession());

      await expect(
        service.interact(sessionId, ownerId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSessionState',
      });
    });
  });

  describe('state type resolution', () => {
    it('returns stateType "character" for a character state id', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          characterStates: [{ id: input.stateId }] as never,
        })
      );

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'character' });
    });

    it('returns stateType "object" for an object state id', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [{ id: input.stateId }] as never,
        })
      );

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'object' });
    });

    it('returns stateType "location" for a location state id', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [{ id: input.stateId }] as never,
        })
      );

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'location' });
    });
  });
});
