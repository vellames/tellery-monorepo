import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
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
  let imageUrlSigner: DeepMockProxy<IImageUrlSigner>;
  let service: HistorySessionService;

  beforeEach(() => {
    users = mockDeep<IUserRepository>();
    histories = mockDeep<IHistoryDefinitionRepository>();
    sessions = mockDeep<ISessionRepository>();
    imageUrlSigner = mockDeep<IImageUrlSigner>();
    imageUrlSigner.sign.mockImplementation(async (key: string | null) =>
      key ? `https://signed.test/${key}` : null
    );
    service = new HistorySessionService(
      users,
      histories,
      sessions,
      imageUrlSigner
    );
  });

  afterEach(() => {
    mockReset(users);
    mockReset(histories);
    mockReset(sessions);
    mockReset(imageUrlSigner);
  });

  describe('startSession', () => {
    it('creates and persists a session for the specified history', async () => {
      const history = mockHistory();
      const session = mockSession();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(history);
      sessions.create.mockResolvedValue(session);

      const result = await service.startSession('user-1', {
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
        service.startSession('nope', { historyId: 'history-1' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws 404 when the specified history is not found', async () => {
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(null);

      await expect(
        service.startSession('user-1', { historyId: 'missing' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('resolves the history by id when provided', async () => {
      const history = mockHistory();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(history);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession('user-1', { historyId: 'history-1' });

      expect(histories.findById).toHaveBeenCalledWith('history-1');
      expect(histories.findBySlug).not.toHaveBeenCalled();
    });

    it('falls back to slug when the history id is not found', async () => {
      const history = mockHistory();
      users.findById.mockResolvedValue(mockUser());
      histories.findById.mockResolvedValue(null);
      histories.findBySlug.mockResolvedValue(history);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession('user-1', {
        historyId: 'missing',
        historySlug: 'o-bilhete-na-mesa-7',
      });

      expect(histories.findById).toHaveBeenCalledWith('missing');
      expect(histories.findBySlug).toHaveBeenCalledWith('o-bilhete-na-mesa-7');
    });
  });

  describe('getSessionState', () => {
    it('returns the session state with signed image urls', async () => {
      const session = mockSession({
        userId: 'user-1',
        coverImageUrl: 'histories/cover.png',
        thumbnailUrl: 'histories/thumb.png',
        characterStates: [
          {
            id: 'char-1',
            name: 'Elisa',
            role: 'Dona do café',
            shortDescription: 'desc',
            imageUrl: 'characters/elisa.png',
            conversationSummary: null,
            clueRevealRules: [],
            secrets: [],
            messages: [],
          },
        ],
        objectStates: [],
        locationStates: [
          {
            id: 'loc-1',
            name: 'Mesa 7',
            shortDescription: 'desc',
            imageUrl: 'locations/mesa7.png',
            initialDescription: 'init',
            visited: false,
            visitedAt: null,
            ambientClues: [],
          },
        ],
        clues: [],
      } as unknown as HistorySessionWithRelations);
      sessions.findById.mockResolvedValue(session);

      const result = await service.getSessionState('session-1', 'user-1');

      expect(result.history.coverImageUrl).toBe(
        'https://signed.test/histories/cover.png'
      );
      expect(result.history.thumbnailUrl).toBe(
        'https://signed.test/histories/thumb.png'
      );
      expect(result.characters[0].imageUrl).toBe(
        'https://signed.test/characters/elisa.png'
      );
      expect(result.locations[0].imageUrl).toBe(
        'https://signed.test/locations/mesa7.png'
      );
    });

    it('throws 404 when the session is not found', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.getSessionState('missing', 'user-1')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(mockSession({ userId: 'other' }));

      await expect(
        service.getSessionState('session-1', 'user-1')
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
