import { HistorySession, InteractionRole } from '@prisma/client';
import type { UpdatedSecretState } from '../../engine/character/character-agent.service';
import type { HistoryWithDefinitions } from '../../repositories/HistoryDefinitionRepository';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface SessionInteractionMessageInput {
  role: InteractionRole;
  content: string;
}

export interface ISessionRepository extends IBaseRepository {
  create(
    input: { userId: string; history: HistoryWithDefinitions },
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations>;
  findById(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations | null>;
  list(userId?: string, tx?: PrismaTransaction): Promise<HistorySession[]>;
  recordObjectInspection(
    input: {
      objectStateId: string;
      discoveredClueIds: string[];
      messages: SessionInteractionMessageInput[];
    },
    tx?: PrismaTransaction
  ): Promise<void>;
  recordCharacterInteraction(
    input: {
      characterStateId: string;
      conversationSummary: string;
      discoveredClueIds: string[];
      updatedSecretStates: UpdatedSecretState[];
      messages: SessionInteractionMessageInput[];
    },
    tx?: PrismaTransaction
  ): Promise<void>;
}
