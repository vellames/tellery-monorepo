import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SessionController } from '../session.controller';
import { StorySessionService } from '../../services/session/story-session.service';
import { SessionInteractionService } from '../../services/session/session-interaction.service';
import { SessionConclusionService } from '../../services/session/session-conclusion.service';
import { IAudioStorage, IAudioTranscriptionService } from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { TranslationFunction } from '../../types/i18n.types';

describe('SessionController - interact', () => {
  let storySessionService: DeepMockProxy<StorySessionService>;
  let sessionInteractionService: DeepMockProxy<SessionInteractionService>;
  let sessionConclusionService: DeepMockProxy<SessionConclusionService>;
  let audioStorage: DeepMockProxy<IAudioStorage>;
  let audioTranscription: DeepMockProxy<IAudioTranscriptionService>;
  let controller: SessionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storySessionService = mockDeep<StorySessionService>();
    sessionInteractionService = mockDeep<SessionInteractionService>();
    sessionConclusionService = mockDeep<SessionConclusionService>();
    audioStorage = mockDeep<IAudioStorage>();
    audioTranscription = mockDeep<IAudioTranscriptionService>();
    controller = new SessionController(
      storySessionService,
      sessionInteractionService,
      sessionConclusionService,
      audioStorage,
      audioTranscription
    );
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storySessionService);
    mockReset(sessionInteractionService);
    mockReset(sessionConclusionService);
  });

  const validBody = { stateId: 'state-1', interaction: 'hello there' };

  it('passes sessionId, authenticated user id and language to the service', async () => {
    const response = {
      id: 'state-1',
      stateType: 'character' as const,
      reply: 'Não vi nada.',
      detectedIntents: [
        { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
      ],
      discoveredClues: [],
    };
    sessionInteractionService.interact.mockResolvedValue(response);
    req = {
      params: { sessionId: 'session-1' },
      body: validBody,
      user: { id: 'user-1', email: 'ana@teste.local' },
      language: 'pt-BR',
      t,
    };

    await controller.interact(req as Request, res as Response);

    expect(sessionInteractionService.interact).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      validBody,
      'pt-BR'
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: response,
      message: undefined,
    });
  });

  it('returns 422 when body is invalid', async () => {
    req = {
      params: { sessionId: 'session-1' },
      body: { stateId: '', interaction: '' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.interact(req as Request, res as Response);

    expect(sessionInteractionService.interact).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 403 when the session is not owned by the user', async () => {
    sessionInteractionService.interact.mockRejectedValue(
      new HttpError(
        StatusCodes.FORBIDDEN,
        'session-1',
        'session:errors.sessionNotOwned'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      body: validBody,
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.interact(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'session:errors.sessionNotOwned' })
    );
  });

  it('returns 404 when the session does not exist', async () => {
    sessionInteractionService.interact.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'session-1',
        'session:errors.unknownSession'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      body: validBody,
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.interact(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it('returns 500 on unexpected errors', async () => {
    sessionInteractionService.interact.mockRejectedValue(new Error('boom'));
    req = {
      params: { sessionId: 'session-1' },
      body: validBody,
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.interact(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe('SessionController - start', () => {
  let storySessionService: DeepMockProxy<StorySessionService>;
  let sessionInteractionService: DeepMockProxy<SessionInteractionService>;
  let sessionConclusionService: DeepMockProxy<SessionConclusionService>;
  let audioStorage: DeepMockProxy<IAudioStorage>;
  let audioTranscription: DeepMockProxy<IAudioTranscriptionService>;
  let controller: SessionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storySessionService = mockDeep<StorySessionService>();
    sessionInteractionService = mockDeep<SessionInteractionService>();
    sessionConclusionService = mockDeep<SessionConclusionService>();
    audioStorage = mockDeep<IAudioStorage>();
    audioTranscription = mockDeep<IAudioTranscriptionService>();
    controller = new SessionController(
      storySessionService,
      sessionInteractionService,
      sessionConclusionService,
      audioStorage,
      audioTranscription
    );
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storySessionService);
    mockReset(sessionInteractionService);
    mockReset(sessionConclusionService);
  });

  it('starts a session for the authenticated user and returns 201', async () => {
    const response = {
      session: { id: 'session-1' },
      sessionStatus: 'active',
      story: { id: 'story-1', title: 'O Bilhete na Mesa 7' },
    } as never;
    storySessionService.startSession.mockResolvedValue(response);
    req = {
      body: { storyId: 'story-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.start(req as Request, res as Response);

    expect(storySessionService.startSession).toHaveBeenCalledWith('user-1', {
      storyId: 'story-1',
    });
    expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: response,
      message: undefined,
    });
  });

  it('returns 422 when body has neither storyId nor storySlug', async () => {
    req = {
      body: {},
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.start(req as Request, res as Response);

    expect(storySessionService.startSession).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 404 when the user is not found', async () => {
    storySessionService.startSession.mockRejectedValue(
      new HttpError(StatusCodes.NOT_FOUND, 'user-1', 'user:errors.unknownUser')
    );
    req = {
      body: { storyId: 'story-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.start(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'user:errors.unknownUser' })
    );
  });
});

describe('SessionController - getSession', () => {
  let storySessionService: DeepMockProxy<StorySessionService>;
  let sessionInteractionService: DeepMockProxy<SessionInteractionService>;
  let sessionConclusionService: DeepMockProxy<SessionConclusionService>;
  let audioStorage: DeepMockProxy<IAudioStorage>;
  let audioTranscription: DeepMockProxy<IAudioTranscriptionService>;
  let controller: SessionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storySessionService = mockDeep<StorySessionService>();
    sessionInteractionService = mockDeep<SessionInteractionService>();
    sessionConclusionService = mockDeep<SessionConclusionService>();
    audioStorage = mockDeep<IAudioStorage>();
    audioTranscription = mockDeep<IAudioTranscriptionService>();
    controller = new SessionController(
      storySessionService,
      sessionInteractionService,
      sessionConclusionService,
      audioStorage,
      audioTranscription
    );
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storySessionService);
    mockReset(sessionInteractionService);
    mockReset(sessionConclusionService);
  });

  it('returns 200 with the session state for the authenticated user', async () => {
    const response = { id: 'session-1', status: 'active', clues: [] } as never;
    storySessionService.getSessionState.mockResolvedValue(response);
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getSession(req as Request, res as Response);

    expect(storySessionService.getSessionState).toHaveBeenCalledWith(
      'session-1',
      'user-1'
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: response,
      message: undefined,
    });
  });

  it('returns 404 when the session does not exist', async () => {
    storySessionService.getSessionState.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'session-1',
        'session:errors.unknownSession'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getSession(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'session:errors.unknownSession' })
    );
  });

  it('returns 403 when the session is not owned by the user', async () => {
    storySessionService.getSessionState.mockRejectedValue(
      new HttpError(
        StatusCodes.FORBIDDEN,
        'session-1',
        'session:errors.sessionNotOwned'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getSession(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
  });
});

describe('SessionController - getCost', () => {
  let storySessionService: DeepMockProxy<StorySessionService>;
  let sessionInteractionService: DeepMockProxy<SessionInteractionService>;
  let sessionConclusionService: DeepMockProxy<SessionConclusionService>;
  let audioStorage: DeepMockProxy<IAudioStorage>;
  let audioTranscription: DeepMockProxy<IAudioTranscriptionService>;
  let controller: SessionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storySessionService = mockDeep<StorySessionService>();
    sessionInteractionService = mockDeep<SessionInteractionService>();
    sessionConclusionService = mockDeep<SessionConclusionService>();
    audioStorage = mockDeep<IAudioStorage>();
    audioTranscription = mockDeep<IAudioTranscriptionService>();
    controller = new SessionController(
      storySessionService,
      sessionInteractionService,
      sessionConclusionService,
      audioStorage,
      audioTranscription
    );
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storySessionService);
    mockReset(sessionInteractionService);
    mockReset(sessionConclusionService);
  });

  it('returns 200 with the session cost summary', async () => {
    const cost = {
      totalCostUsd: 0.00025,
      totalCalls: 3,
      totalAudioSeconds: 0,
      breakdown: [
        { purpose: 'character', costUsd: 0.0002, calls: 2, audioSeconds: null },
      ],
    };
    storySessionService.getSessionCost.mockResolvedValue(cost);
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getCost(req as Request, res as Response);

    expect(storySessionService.getSessionCost).toHaveBeenCalledWith(
      'session-1',
      'user-1'
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: cost,
      message: undefined,
    });
  });

  it('returns 404 when the session does not exist', async () => {
    storySessionService.getSessionCost.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'session-1',
        'session:errors.unknownSession'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getCost(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it('returns 403 when the session is not owned by the user', async () => {
    storySessionService.getSessionCost.mockRejectedValue(
      new HttpError(
        StatusCodes.FORBIDDEN,
        'session-1',
        'session:errors.sessionNotOwned'
      )
    );
    req = {
      params: { sessionId: 'session-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getCost(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
  });
});
