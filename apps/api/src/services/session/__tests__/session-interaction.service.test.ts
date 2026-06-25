import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { StatusCodes } from 'http-status-codes';
import { SessionInteractionService } from '../session-interaction.service';
import {
  IHistoryRepository,
  IHistorySessionRepository,
} from '../../../interfaces';
import { createHistorySession, HistorySession } from '../../../models';
import { createLocationSessionState } from '../../../models/history_session/LocationSessionState';

describe('SessionInteractionService', () => {
  let histories: DeepMockProxy<IHistoryRepository>;
  let sessions: DeepMockProxy<IHistorySessionRepository>;
  let service: SessionInteractionService;

  const ownerId = 'user-owner';
  const intruderId = 'user-intruder';
  const sessionId = 'session-1';

  let session: HistorySession;

  beforeEach(() => {
    histories = mockDeep<IHistoryRepository>();
    sessions = mockDeep<IHistorySessionRepository>();
    service = new SessionInteractionService(histories, sessions);

    session = createHistorySession({
      userId: ownerId,
      historyId: 'history-1',
      historyVersion: 1,
    });
    session.id = sessionId;
    session.locationStates = [
      createLocationSessionState({ locationId: 'location-1' }),
    ];
    session.locationStates[0].id = input.stateId;
  });

  afterEach(() => {
    mockReset(histories);
    mockReset(sessions);
  });

  const input = { stateId: 'state-1', interaction: 'hello' };

  describe('ownership validation', () => {
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

      expect(histories.findById).not.toHaveBeenCalled();
    });

    it('proceeds past the ownership check when the user owns the session', async () => {
      sessions.findById.mockReturnValue(session);
      histories.findById.mockReturnValue(undefined);

      await expect(
        service.interact(sessionId, ownerId, input)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownHistory',
      });

      expect(histories.findById).toHaveBeenCalledWith(session.historyId);
    });
  });
});
