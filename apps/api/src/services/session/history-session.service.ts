import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
  ISessionRepository,
  IUserRepository,
} from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { StartSessionBody } from '../../types/http/session.validation';
import { StatusCodes } from 'http-status-codes';
import {
  buildSessionStateResponse,
  SessionStateResponse,
} from './session-state.mapper';

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

    const session = await this.sessions.create({
      userId: user.id,
      history,
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

  private async signImages(
    response: SessionStateResponse
  ): Promise<SessionStateResponse> {
    const [historyImages, characterImages, objectImages, locationImages] =
      await Promise.all([
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
    };
  }
}
