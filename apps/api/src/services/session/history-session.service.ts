import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
  ISessionRepository,
  IUserRepository,
} from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { StartSessionBody } from '../../types/http/session.validation';
import { StatusCodes } from 'http-status-codes';
import { fromNanos } from '../../engine/llm/cost';
import {
  buildSessionStateResponse,
  SessionStateResponse,
} from './session-state.mapper';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export interface SessionListItem {
  id: string;
  status: string;
  title: string;
  genre: string;
  thumbnailUrl: string | null;
  startedAt: Date;
  completedAt: Date | null;
  historyId: string;
  endingType: string | null;
}

export interface PaginatedSessions {
  items: SessionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SessionCostBreakdownItemResponse {
  purpose: string;
  costUsd: number;
  calls: number;
  audioSeconds: number | null;
}

export interface SessionCostResponse {
  totalCostUsd: number;
  totalCalls: number;
  totalAudioSeconds: number;
  breakdown: SessionCostBreakdownItemResponse[];
}

export class HistorySessionService {
  constructor(
    private readonly users: IUserRepository,
    private readonly histories: IHistoryDefinitionRepository,
    private readonly sessions: ISessionRepository,
    private readonly imageUrlSigner: IImageUrlSigner
  ) {}

  async startSession(userId: string, input: StartSessionBody) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        userId,
        'user:errors.unknownUser'
      );
    }

    const history =
      (input.historyId
        ? await this.histories.findById(input.historyId)
        : null) ??
      (input.historySlug
        ? await this.histories.findBySlug(input.historySlug)
        : null);

    if (!history) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        input.historyId ?? input.historySlug ?? '',
        'session:errors.unknownHistory'
      );
    }

    const existingSession = await this.sessions.findActiveByHistory(
      user.id,
      history.id
    );
    if (existingSession) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        existingSession.id,
        'session:errors.sessionAlreadyActive',
        { sessionId: existingSession.id }
      );
    }

    const session = await this.sessions.runTransaction(async (tx) => {
      const decremented = await this.users.decrementAvailableCredits(
        user.id,
        tx
      );
      if (!decremented) {
        throw new HttpError(
          StatusCodes.PAYMENT_REQUIRED,
          user.id,
          'session:errors.noCreditsAvailable'
        );
      }
      return this.sessions.create({ userId: user.id, history }, tx);
    });

    return {
      session,
      sessionStatus: session.status,
      history: {
        id: history.id,
        slug: history.slug,
        title: history.title,
        subtitle: history.subtitle ?? null,
        opening: history.opening,
        objective: history.objective,
      },
    };
  }

  async getSessionState(
    sessionId: string,
    userId: string
  ): Promise<SessionStateResponse> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        sessionId,
        'session:errors.unknownSession'
      );
    }

    if (session.userId !== userId) {
      throw new HttpError(
        StatusCodes.FORBIDDEN,
        sessionId,
        'session:errors.sessionNotOwned'
      );
    }

    return this.signImages(buildSessionStateResponse(session));
  }

  async abandonSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        sessionId,
        'session:errors.unknownSession'
      );
    }

    if (session.userId !== userId) {
      throw new HttpError(
        StatusCodes.FORBIDDEN,
        sessionId,
        'session:errors.sessionNotOwned'
      );
    }

    if (session.status !== 'active') {
      throw new HttpError(
        StatusCodes.CONFLICT,
        sessionId,
        'session:errors.sessionNotActive'
      );
    }

    await this.sessions.abandon(sessionId);
  }

  async getSessionCost(
    sessionId: string,
    userId: string
  ): Promise<SessionCostResponse> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        sessionId,
        'session:errors.unknownSession'
      );
    }

    if (session.userId !== userId) {
      throw new HttpError(
        StatusCodes.FORBIDDEN,
        sessionId,
        'session:errors.sessionNotOwned'
      );
    }

    const summary = await this.sessions.getSessionCost(sessionId);

    return {
      totalCostUsd: fromNanos(summary.totalCostUsdNanos),
      totalCalls: summary.breakdown.reduce((sum, item) => sum + item.calls, 0),
      totalAudioSeconds: summary.totalAudioSeconds,
      breakdown: summary.breakdown.map((item) => ({
        purpose: item.purpose,
        costUsd: fromNanos(item.costUsdNanos),
        calls: item.calls,
        audioSeconds: item.audioSeconds,
      })),
    };
  }

  async listSessions(
    userId: string,
    page?: number,
    limit?: number,
    status?: string
  ): Promise<PaginatedSessions> {
    const normalizedPage = Math.max(1, page ?? 1);
    const normalizedLimit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, limit ?? DEFAULT_PAGE_SIZE)
    );

    const { items, total } = await this.sessions.list(
      userId,
      normalizedPage,
      normalizedLimit,
      status
    );

    const signedItems = await Promise.all(
      items.map(async (session) => ({
        id: session.id,
        status: session.status,
        title: session.title,
        genre: session.genre,
        thumbnailUrl: await this.imageUrlSigner.sign(session.thumbnailUrl),
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        historyId: session.historyId,
        endingType: session.ending?.endingSnapshot.type ?? null,
      }))
    );

    return {
      items: signedItems,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }

  private async signImages(
    response: SessionStateResponse
  ): Promise<SessionStateResponse> {
    const [
      historyImages,
      characterImages,
      objectImages,
      locationImages,
      endingImage,
    ] = await Promise.all([
      Promise.all([
        this.imageUrlSigner.sign(response.history.coverImageUrl),
        this.imageUrlSigner.sign(response.history.thumbnailUrl),
      ]),
      Promise.all(
        response.characters.map((c) => this.imageUrlSigner.sign(c.imageUrl))
      ),
      Promise.all(
        response.objects.map((o) => this.imageUrlSigner.sign(o.imageUrl))
      ),
      Promise.all(
        response.locations.map((l) => this.imageUrlSigner.sign(l.imageUrl))
      ),
      response.ending
        ? this.imageUrlSigner.sign(response.ending.snapshot.imageUrl)
        : Promise.resolve(null),
    ]);

    return {
      ...response,
      history: {
        ...response.history,
        coverImageUrl: historyImages[0],
        thumbnailUrl: historyImages[1],
      },
      characters: response.characters.map((c, i) => ({
        ...c,
        imageUrl: characterImages[i],
      })),
      objects: response.objects.map((o, i) => ({
        ...o,
        imageUrl: objectImages[i],
      })),
      locations: response.locations.map((l, i) => ({
        ...l,
        imageUrl: locationImages[i],
      })),
      ending: response.ending
        ? {
            ...response.ending,
            snapshot: {
              ...response.ending.snapshot,
              imageUrl: endingImage,
            },
          }
        : null,
    };
  }
}
