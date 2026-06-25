import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IHistoryDefinitionRepository,
  ISessionRepository,
  IUserRepository,
} from '../../../interfaces';
import type { HistoryWithDefinitions } from '../../../repositories/HistoryDefinitionRepository';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';
import { HistorySessionService } from '../history-session.service';

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    name: 'Ana Teste',
    email: 'ana@teste.local',
    password: 'hashed',
    ...overrides,
  }) as User;

const mockHistory = (): HistoryWithDefinitions =>
  ({
    id: 'history-1',
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    opening: 'opening text',
    objective: 'objective text',
  }) as unknown as HistoryWithDefinitions;

const mockSession = (
  overrides: Partial<HistorySessionWithRelations> = {}
): HistorySessionWithRelations =>
  ({
    id: 'session-1',
    status: 'active',
    ...overrides,
  }) as unknown as HistorySessionWithRelations;

describe('HistorySessionService', () => {
  let users: DeepMockProxy<IUserRepository>;
  let histories: DeepMockProxy<IHistoryDefinitionRepository>;
  let sessions: DeepMockProxy<ISessionRepository>;
  let service: HistorySessionService;

  beforeEach(() => {
    users = mockDeep<IUserRepository>();
    histories = mockDeep<IHistoryDefinitionRepository>();
    sessions = mockDeep<ISessionRepository>();
    service = new HistorySessionService(users, histories, sessions);
  });

  afterEach(() => {
    mockReset(users);
    mockReset(histories);
    mockReset(sessions);
  });

  describe('startSession', () => {
    it('creates and persists a session for the specified history', async () => {
      const history = mockHistory();
      const session = mockSession();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(history);
      sessions.create.mockResolvedValue(session);

      const result = await service.startSession({
        userId: 'user-1',
        historyId: 'history-1',
      });

      expect(sessions.create).toHaveBeenCalledWith({
        userId: 'user-1',
        history,
      });
      expect(result).toEqual({
        session,
        sessionStatus: 'active',
        history: {
          id: 'history-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
          subtitle: null,
          opening: 'opening text',
          objective: 'objective text',
        },
      });
    });

    it('throws 404 when the user does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.startSession({ userId: 'nope', historyId: 'history-1' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws 404 when the specified history is not found', async () => {
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(null);

      await expect(
        service.startSession({ userId: 'user-1', historyId: 'missing' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('resolves the history by id when provided', async () => {
      const history = mockHistory();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(history);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession({ userId: 'user-1', historyId: 'history-1' });

      expect(histories.findById).toHaveBeenCalledWith('history-1');
      expect(histories.findBySlug).not.toHaveBeenCalled();
    });

    it('falls back to slug when the history id is not found', async () => {
      const history = mockHistory();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(null);
      histories.findBySlug.mockResolvedValue(history);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession({
        userId: 'user-1',
        historyId: 'missing',
        historySlug: 'o-bilhete-na-mesa-7',
      });

      expect(histories.findById).toHaveBeenCalledWith('missing');
      expect(histories.findBySlug).toHaveBeenCalledWith('o-bilhete-na-mesa-7');
    });
  });
});
