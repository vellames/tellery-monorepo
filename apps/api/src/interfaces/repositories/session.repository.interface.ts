import { StorySession, InteractionRole, LlmCallPurpose } from '@prisma/client';
import type { UpdatedSecretState } from '../../engine/character/character-agent.service';
import type { StoryWithDefinitions } from '../../repositories/StoryDefinitionRepository';
import type {
  StorySessionWithRelations,
  SessionListItemWithEnding,
} from '../../repositories/SessionRepository';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface SessionInteractionMessageInput {
  role: InteractionRole;
  content: string;
}

export interface LlmCallRecordInput {
  sessionId: string;
  purpose: LlmCallPurpose;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsdNanos: bigint;
  latencyMs?: number | null;
  audioSeconds?: number | null;
}

export interface SessionCostBreakdownItem {
  purpose: LlmCallPurpose;
  costUsdNanos: bigint;
  calls: number;
  audioSeconds: number | null;
}

export interface SessionCostSummary {
  totalCostUsdNanos: bigint;
  totalAudioSeconds: number;
  breakdown: SessionCostBreakdownItem[];
}

export interface ISessionRepository extends IBaseRepository {
  create(
    input: { userId: string; story: StoryWithDefinitions },
    tx?: PrismaTransaction
  ): Promise<StorySessionWithRelations>;
  findById(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<StorySessionWithRelations | null>;
  findActiveByStory(
    userId: string,
    storyId: string,
    tx?: PrismaTransaction
  ): Promise<StorySession | null>;
  abandon(sessionId: string, tx?: PrismaTransaction): Promise<void>;
  list(
    userId?: string,
    page?: number,
    limit?: number,
    status?: string,
    tx?: PrismaTransaction
  ): Promise<{ items: SessionListItemWithEnding[]; total: number }>;
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
      discoveredClueIds: string[];
      updatedSecretStates: UpdatedSecretState[];
      messages: SessionInteractionMessageInput[];
    },
    tx?: PrismaTransaction
  ): Promise<void>;
  recordLocationVisit(
    input: {
      locationStateId: string;
      revealedAmbientClueIds: string[];
      discoveredClueIds: string[];
    },
    tx?: PrismaTransaction
  ): Promise<void>;
  submitConclusion(
    input: {
      sessionId: string;
      endingSnapshotId: string;
      answers: { fieldId: string; optionId: string }[];
      score: {
        discoveredClues: number;
        totalClues: number;
        requiredCluesDiscovered: number;
        totalRequiredClues: number;
        correctAnswers: number;
        totalAnswers: number;
      };
    },
    tx?: PrismaTransaction
  ): Promise<void>;
  recordLlmCall(
    input: LlmCallRecordInput,
    tx?: PrismaTransaction
  ): Promise<void>;
  getSessionCost(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<SessionCostSummary>;
}
