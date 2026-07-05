import { Subscription, User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IStoryDefinitionRepository,
  IImageUrlSigner,
  ISessionRepository,
  ISubscriptionRepository,
  IUserRepository,
} from '../../../interfaces';
import type { StoryWithDefinitions } from '../../../repositories/StoryDefinitionRepository';
import type { StorySessionWithRelations } from '../../../repositories/SessionRepository';
import { StorySessionService } from '../story-session.service';

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    name: 'Ana Teste',
    email: 'ana@teste.local',
    password: 'hashed',
    ssn: null,
    availableCredits: 3,
    ...overrides,
  }) as User;

const mockStory = (
  overrides: Partial<StoryWithDefinitions> = {}
): StoryWithDefinitions =>
  ({
    id: 'story-1',
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    opening: 'opening text',
    objective: 'objective text',
    isFree: true,
    ...overrides,
  }) as unknown as StoryWithDefinitions;

const mockSubscription = (
  overrides: Partial<Subscription> = {}
): Subscription =>
  ({
    id: 'sub-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    userId: 'user-1',
    planId: null,
    stripeCustomerId: 'cust-1',
    stripeSubscriptionId: 'stripe-sub-1',
    stripePriceId: null,
    status: 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  }) as Subscription;

const mockSession = (
  overrides: Partial<StorySessionWithRelations> = {}
): StorySessionWithRelations =>
  ({
    id: 'session-1',
    status: 'active',
    userId: 'user-1',
    clues: [],
    conclusionFields: [],
    endingSnapshots: [],
    conclusion: null,
    ending: null,
    ...overrides,
  }) as unknown as StorySessionWithRelations;

describe('StorySessionService', () => {
  let users: DeepMockProxy<IUserRepository>;
  let stories: DeepMockProxy<IStoryDefinitionRepository>;
  let sessions: DeepMockProxy<ISessionRepository>;
  let imageUrlSigner: DeepMockProxy<IImageUrlSigner>;
  let subscriptions: DeepMockProxy<ISubscriptionRepository>;
  let service: StorySessionService;

  beforeEach(() => {
    users = mockDeep<IUserRepository>();
    stories = mockDeep<IStoryDefinitionRepository>();
    sessions = mockDeep<ISessionRepository>();
    imageUrlSigner = mockDeep<IImageUrlSigner>();
    subscriptions = mockDeep<ISubscriptionRepository>();
    imageUrlSigner.sign.mockImplementation(async (key: string | null) =>
      key ? `https://signed.test/${key}` : null
    );
    service = new StorySessionService(
      users,
      stories,
      sessions,
      imageUrlSigner,
      subscriptions
    );

    sessions.runTransaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (cb: any) => cb({})
    );
    users.decrementAvailableCredits.mockResolvedValue(true);
    subscriptions.findByUserId.mockResolvedValue(null);
  });

  afterEach(() => {
    mockReset(users);
    mockReset(stories);
    mockReset(sessions);
    mockReset(imageUrlSigner);
    mockReset(subscriptions);
  });

  describe('startSession', () => {
    it('creates and persists a session for the specified story', async () => {
      const story = mockStory();
      const session = mockSession();
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(story);
      sessions.findActiveByStory.mockResolvedValue(null);
      sessions.create.mockResolvedValue(session);

      const result = await service.startSession('user-1', {
        storyId: 'story-1',
      });

      expect(users.decrementAvailableCredits).toHaveBeenCalledWith(
        'user-1',
        expect.anything()
      );
      expect(sessions.create).toHaveBeenCalledWith(
        { userId: 'user-1', story },
        expect.anything()
      );
      expect(result).toEqual({
        session,
        sessionStatus: 'active',
        story: {
          id: 'story-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
          subtitle: null,
          opening: 'opening text',
          objective: 'objective text',
        },
      });
    });

    it('throws 409 when an active session already exists for the same story', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(mockStory());
      sessions.findActiveByStory.mockResolvedValue(
        mockSession({ id: 'existing-session' })
      );

      await expect(
        service.startSession('user-1', { storyId: 'story-1' })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        messageKey: 'session:errors.sessionAlreadyActive',
      });
      expect(sessions.create).not.toHaveBeenCalled();
      expect(users.decrementAvailableCredits).not.toHaveBeenCalled();
    });

    it('throws 402 when the user has no available sessions left', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(mockStory());
      sessions.findActiveByStory.mockResolvedValue(null);
      users.decrementAvailableCredits.mockResolvedValue(false);

      await expect(
        service.startSession('user-1', { storyId: 'story-1' })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.PAYMENT_REQUIRED,
        messageKey: 'session:errors.noCreditsAvailable',
      });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws 404 when the user does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.startSession('nope', { storyId: 'story-1' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws 404 when the specified story is not found', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(null);

      await expect(
        service.startSession('user-1', { storyId: 'missing' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('resolves the story by id when provided', async () => {
      const story = mockStory();
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(story);
      sessions.findActiveByStory.mockResolvedValue(null);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession('user-1', { storyId: 'story-1' });

      expect(stories.findById).toHaveBeenCalledWith('story-1');
      expect(stories.findBySlug).not.toHaveBeenCalled();
    });

    it('falls back to slug when the story id is not found', async () => {
      const story = mockStory();
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(null);
      stories.findBySlug.mockResolvedValue(story);
      sessions.findActiveByStory.mockResolvedValue(null);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession('user-1', {
        storyId: 'missing',
        storySlug: 'o-bilhete-na-mesa-7',
      });

      expect(stories.findById).toHaveBeenCalledWith('missing');
      expect(stories.findBySlug).toHaveBeenCalledWith('o-bilhete-na-mesa-7');
    });

    it('throws 402 subscriptionRequired when a premium story is started without a subscription', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(mockStory({ isFree: false }));
      sessions.findActiveByStory.mockResolvedValue(null);
      subscriptions.findByUserId.mockResolvedValue(null);

      await expect(
        service.startSession('user-1', { storyId: 'story-1' })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.PAYMENT_REQUIRED,
        messageKey: 'session:errors.subscriptionRequired',
      });
      expect(subscriptions.findByUserId).toHaveBeenCalledWith('user-1');
      expect(users.decrementAvailableCredits).not.toHaveBeenCalled();
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('throws 402 subscriptionRequired when a premium story is started with an inactive subscription', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(mockStory({ isFree: false }));
      sessions.findActiveByStory.mockResolvedValue(null);
      subscriptions.findByUserId.mockResolvedValue(
        mockSubscription({ status: 'canceled' })
      );

      await expect(
        service.startSession('user-1', { storyId: 'story-1' })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.PAYMENT_REQUIRED,
        messageKey: 'session:errors.subscriptionRequired',
      });
      expect(users.decrementAvailableCredits).not.toHaveBeenCalled();
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('starts a premium story when the user has an active subscription', async () => {
      const story = mockStory({ isFree: false });
      const session = mockSession();
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(story);
      sessions.findActiveByStory.mockResolvedValue(null);
      subscriptions.findByUserId.mockResolvedValue(mockSubscription());
      sessions.create.mockResolvedValue(session);

      const result = await service.startSession('user-1', {
        storyId: 'story-1',
      });

      expect(subscriptions.findByUserId).toHaveBeenCalledWith('user-1');
      expect(users.decrementAvailableCredits).toHaveBeenCalledWith(
        'user-1',
        expect.anything()
      );
      expect(sessions.create).toHaveBeenCalledWith(
        { userId: 'user-1', story },
        expect.anything()
      );
      expect(result.session).toBe(session);
    });

    it('does not check the subscription for a free story', async () => {
      users.findById.mockResolvedValue(mockUser());
      stories.findById.mockResolvedValue(mockStory({ isFree: true }));
      sessions.findActiveByStory.mockResolvedValue(null);
      sessions.create.mockResolvedValue(mockSession());

      await service.startSession('user-1', { storyId: 'story-1' });

      expect(subscriptions.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('getSessionState', () => {
    it('returns the session state with signed image urls', async () => {
      const session = mockSession({
        userId: 'user-1',
        coverImageUrl: 'stories/cover.png',
        thumbnailUrl: 'stories/thumb.png',
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
      } as unknown as StorySessionWithRelations);
      sessions.findById.mockResolvedValue(session);

      const result = await service.getSessionState('session-1', 'user-1');

      expect(result.story.coverImageUrl).toBe(
        'https://signed.test/stories/cover.png'
      );
      expect(result.story.thumbnailUrl).toBe(
        'https://signed.test/stories/thumb.png'
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

  describe('abandonSession', () => {
    it('abandons an active session', async () => {
      sessions.findById.mockResolvedValue(mockSession());

      await service.abandonSession('session-1', 'user-1');

      expect(sessions.abandon).toHaveBeenCalledWith('session-1');
    });

    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.abandonSession('missing', 'user-1')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(mockSession({ userId: 'other' }));

      await expect(
        service.abandonSession('session-1', 'user-1')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 409 when the session is not active', async () => {
      sessions.findById.mockResolvedValue(mockSession({ status: 'completed' }));

      await expect(
        service.abandonSession('session-1', 'user-1')
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        messageKey: 'session:errors.sessionNotActive',
      });
      expect(sessions.abandon).not.toHaveBeenCalled();
    });
  });

  describe('getSessionCost', () => {
    it('returns the total cost, audio seconds and per-purpose breakdown in USD', async () => {
      sessions.findById.mockResolvedValue(mockSession());
      sessions.getSessionCost.mockResolvedValue({
        totalCostUsdNanos: 250_100n,
        totalAudioSeconds: 6,
        breakdown: [
          {
            purpose: 'character',
            costUsdNanos: 200_000n,
            calls: 2,
            audioSeconds: null,
          },
          {
            purpose: 'intent',
            costUsdNanos: 50_000n,
            calls: 1,
            audioSeconds: null,
          },
          {
            purpose: 'audio',
            costUsdNanos: 100n,
            calls: 1,
            audioSeconds: 6,
          },
        ],
      });

      const result = await service.getSessionCost('session-1', 'user-1');

      expect(sessions.getSessionCost).toHaveBeenCalledWith('session-1');
      expect(result.totalCostUsd).toBeCloseTo(0.0002501, 9);
      expect(result.totalCalls).toBe(4);
      expect(result.totalAudioSeconds).toBe(6);
      expect(result.breakdown).toEqual([
        {
          purpose: 'character',
          costUsd: expect.closeTo(0.0002, 9),
          calls: 2,
          audioSeconds: null,
        },
        {
          purpose: 'intent',
          costUsd: expect.closeTo(0.00005, 9),
          calls: 1,
          audioSeconds: null,
        },
        {
          purpose: 'audio',
          costUsd: expect.closeTo(0.0000001, 9),
          calls: 1,
          audioSeconds: 6,
        },
      ]);
    });

    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.getSessionCost('session-1', 'user-1')
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSession',
      });
      expect(sessions.getSessionCost).not.toHaveBeenCalled();
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(mockSession({ userId: 'user-1' }));

      await expect(
        service.getSessionCost('session-1', 'user-intruder')
      ).rejects.toMatchObject({
        statusCode: StatusCodes.FORBIDDEN,
        messageKey: 'session:errors.sessionNotOwned',
      });
      expect(sessions.getSessionCost).not.toHaveBeenCalled();
    });
  });
});
