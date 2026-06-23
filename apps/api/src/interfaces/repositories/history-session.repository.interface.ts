import { History, HistorySession } from '../../models';
import { IBaseRepository } from './base.repository.interface';

export interface CharacterConversationMessage {
  role: 'user' | 'character';
  content: string;
  createdAt: Date;
}

export interface IHistorySessionRepository extends IBaseRepository {
  create(input: { userId: string; history: History }): HistorySession;
  findById(sessionId: string): HistorySession | undefined;
  list(): HistorySession[];
  appendCharacterConversationMessage(input: {
    sessionId: string;
    characterStateId: string;
    message: CharacterConversationMessage;
  }): void;
  getRecentCharacterConversation(input: {
    sessionId: string;
    characterStateId: string;
    limit?: number;
  }): CharacterConversationMessage[];
}
