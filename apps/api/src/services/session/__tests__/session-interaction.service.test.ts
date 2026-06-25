import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { StatusCodes } from 'http-status-codes';
import { SessionInteractionService } from '../session-interaction.service';
import { IHistorySessionRepository } from '../../../interfaces';
import { createHistorySession, HistorySession } from '../../../models';
import {
  createCharacterSessionState,
} from '../../../models/history_session/CharacterSessionState';
import {
  createLocationSessionState,
} from '../../../models/history_session/LocationSessionState';
import {
  createObjectSessionState,
} from '../../../models/history_session/ObjectSessionState';

describe('SessionInteractionService', () => {
  let sessions: DeepMockProxy<IHistorySessionRepository>;
  let service: SessionInteractionService;

  const ownerId = 'user-owner';
  const intruderId = 'user-intruder';
  const sessionId = 'session-1';

  let session: HistorySession;

  beforeEach(() => {
    sessions = mockDeep<IHistorySessionRepository>();
    service = new SessionInteractionService(sessions);

    session = createHistorySession({
      userId: ownerId,
      historyId: 'history-1',
      historyVersion: 1,
    });
    session.id = sessionId;
  });

  afterEach(() => {
    mockReset(sessions);
  });

  const input = { stateId: 'state-1', interaction: 'hello' };

  describe('session resolution', () => {
    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockReturnValue(undefined);

      await expect(
        service.interact(sessionId, ownerId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSession',
      });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockReturnValue(session);

      await expect(
        service.interact(sessionId, intruderId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.FORBIDDEN,
        messageKey: 'session:errors.sessionNotOwned',
      });
    });

    it('throws 404 when the state does not exist in the session', async () => {
      sessions.findById.mockReturnValue(session);

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
      const state = createCharacterSessionState({ characterId: 'char-1' });
      state.id = input.stateId;
      session.characterStates = [state];
      sessions.findById.mockReturnValue(session);

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'character' });
    });

    it('returns stateType "object" for an object state id', async () => {
      const state = createObjectSessionState({ objectId: 'obj-1' });
      state.id = input.stateId;
      session.objectStates = [state];
      sessions.findById.mockReturnValue(session);

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'object' });
    });

    it('returns stateType "location" for a location state id', async () => {
      const state = createLocationSessionState({ locationId: 'loc-1' });
      state.id = input.stateId;
      session.locationStates = [state];
      sessions.findById.mockReturnValue(session);

      const result = await service.interact(sessionId, ownerId, input);

      expect(result).toEqual({ id: input.stateId, stateType: 'location' });
    });
  });
});
