import {
  createCharacterSessionState,
  createHistorySession,
  createLocationSessionState,
  createObjectSessionState,
  History,
  HistorySession,
} from "../models";

export class HistorySessionRepository {
  private readonly sessions = new Map<string, HistorySession>();

  create(input: { userId: string; history: History }): HistorySession {
    const session = createHistorySession({
      userId: input.userId,
      historyId: input.history.id,
      historyVersion: input.history.version,
    });

    session.characterStates = input.history.characters.map((character) =>
      createCharacterSessionState({ characterId: character.id })
    );
    session.locationStates = input.history.locations.map((location) =>
      createLocationSessionState({ locationId: location.id })
    );
    session.objectStates = input.history.objects.map((object) =>
      createObjectSessionState({ objectId: object.id })
    );

    this.sessions.set(session.id, session);

    return session;
  }

  findById(sessionId: string): HistorySession | undefined {
    const session = this.sessions.get(sessionId);

    if (!session || session.deletedAt) return undefined;

    return session;
  }

  list(): HistorySession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => !session.deletedAt
    );
  }
}
