import {
  createCharacterSessionState,
  createHistorySession,
  createLocationSessionState,
  createObjectSessionState,
  History,
  HistorySession,
} from "../models";

export interface CharacterConversationMessage {
  role: "user" | "character";
  content: string;
  createdAt: Date;
}

export class HistorySessionRepository {
  private readonly sessions = new Map<string, HistorySession>();
  private readonly characterConversationMessages = new Map<
    string,
    CharacterConversationMessage[]
  >();

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

  appendCharacterConversationMessage(input: {
    sessionId: string;
    characterStateId: string;
    message: CharacterConversationMessage;
  }): void {
    const key = this.createCharacterConversationKey(
      input.sessionId,
      input.characterStateId
    );
    const messages = this.characterConversationMessages.get(key) ?? [];

    messages.push(input.message);
    this.characterConversationMessages.set(key, messages);
  }

  getRecentCharacterConversation(input: {
    sessionId: string;
    characterStateId: string;
    limit?: number;
  }): CharacterConversationMessage[] {
    const key = this.createCharacterConversationKey(
      input.sessionId,
      input.characterStateId
    );
    const messages = this.characterConversationMessages.get(key) ?? [];

    return messages.slice(-(input.limit ?? 6));
  }

  private createCharacterConversationKey(
    sessionId: string,
    characterStateId: string
  ): string {
    return `${sessionId}:${characterStateId}`;
  }
}
