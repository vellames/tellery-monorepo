import {
  PrismaClient,
  Prisma,
  HistorySession,
  InteractionRole,
} from '@prisma/client';
import { ISessionRepository } from '../interfaces';
import type { UpdatedSecretState } from '../engine/character/character-agent.service';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';
import type { HistoryWithDefinitions } from './HistoryDefinitionRepository';
import {
  buildCharacterStates,
  buildEndingSnapshots,
  buildLocationStates,
  buildObjectStates,
  buildSessionRootCreateData,
  DefinitionIdMap,
} from './session-snapshot.factory';

export const historySessionInclude = {
  clues: true,
  intents: true,
  characterStates: {
    include: {
      clueRevealRules: {
        include: { clue: true, triggerIntents: true, requiredClues: true },
      },
      secrets: {
        include: {
          revealStages: {
            include: {
              triggerIntents: true,
              requiredClues: true,
              revealsClues: true,
            },
          },
          revealedClues: true,
        },
      },
      revealedClues: true,
      messages: true,
    },
  },
  locationStates: {
    include: { ambientClues: true, revealedAmbientClues: true },
  },
  objectStates: {
    include: {
      clueRevealRules: {
        include: { clue: true, triggerIntents: true, requiredClues: true },
      },
      revealedClues: true,
      messages: true,
    },
  },
  conclusionFields: {
    include: { options: true, answers: true },
  },
  endingSnapshots: {
    include: { requiredClues: true },
  },
  conclusion: {
    include: { answers: true },
  },
  ending: {
    include: {
      endingSnapshot: true,
      score: true,
    },
  },
} satisfies Prisma.HistorySessionInclude;

export type HistorySessionWithRelations = Prisma.HistorySessionGetPayload<{
  include: typeof historySessionInclude;
}>;

export type SessionListItemWithEnding = Prisma.HistorySessionGetPayload<{
  include: {
    ending: {
      include: { endingSnapshot: { select: { type: true } } };
    };
  };
}>;

export class SessionRepository
  extends BaseRepository
  implements ISessionRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(
    input: { userId: string; history: HistoryWithDefinitions },
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations> {
    const run = async (
      client: PrismaTransaction
    ): Promise<HistorySessionWithRelations> => {
      const session = await client.historySession.create({
        data: buildSessionRootCreateData(input.history, input.userId),
        include: { clues: true, intents: true },
      });

      const clueMap: DefinitionIdMap = Object.fromEntries(
        session.clues.map((clue) => [clue.clueDefinitionId, clue.id])
      );
      const intentMap: DefinitionIdMap = Object.fromEntries(
        session.intents.map((intent) => [intent.intentDefinitionId, intent.id])
      );

      for (const data of buildEndingSnapshots(
        input.history,
        session.id,
        clueMap
      )) {
        await client.sessionEndingSnapshot.create({ data });
      }
      const createdLocations: { id: string; locationDefinitionId: string }[] =
        [];
      for (const data of buildLocationStates(
        input.history,
        session.id,
        clueMap
      )) {
        const created = await client.locationSessionState.create({
          data,
          select: { id: true, locationDefinitionId: true },
        });
        createdLocations.push(created);
      }
      const locationMap: DefinitionIdMap = Object.fromEntries(
        createdLocations.map((loc) => [loc.locationDefinitionId, loc.id])
      );
      for (const data of buildObjectStates(
        input.history,
        session.id,
        clueMap,
        intentMap,
        locationMap
      )) {
        await client.objectSessionState.create({ data });
      }
      for (const data of buildCharacterStates(
        input.history,
        session.id,
        clueMap,
        intentMap
      )) {
        await client.characterSessionState.create({ data });
      }

      const full = await client.historySession.findFirst({
        where: { id: session.id },
        include: historySessionInclude,
      });
      if (!full) {
        throw new Error(`Session ${session.id} not found after creation`);
      }
      return full;
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(run);
  }

  async findById(
    sessionId: string,
    tx?: PrismaTransaction
  ): Promise<HistorySessionWithRelations | null> {
    const client = tx ?? this.prisma;
    return client.historySession.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: historySessionInclude,
    });
  }

  async findActiveByHistory(
    userId: string,
    historyId: string,
    tx?: PrismaTransaction
  ): Promise<HistorySession | null> {
    const client = tx ?? this.prisma;
    return client.historySession.findFirst({
      where: {
        userId,
        historyId,
        status: 'active',
        deletedAt: null,
      },
    });
  }

  async abandon(sessionId: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx ?? this.prisma;
    await client.historySession.update({
      where: { id: sessionId },
      data: { status: 'abandoned' },
    });
  }

  async list(
    userId?: string,
    page = 1,
    limit = 10,
    status?: string,
    tx?: PrismaTransaction
  ): Promise<{ items: SessionListItemWithEnding[]; total: number }> {
    const client = tx ?? this.prisma;
    const where: Record<string, unknown> = { deletedAt: null };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      client.historySession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ending: {
            include: { endingSnapshot: { select: { type: true } } },
          },
        },
      }),
      client.historySession.count({ where }),
    ]);

    return { items, total };
  }

  async recordObjectInspection(
    input: {
      objectStateId: string;
      discoveredClueIds: string[];
      messages: { role: InteractionRole; content: string }[];
    },
    tx?: PrismaTransaction
  ): Promise<void> {
    const run = async (client: PrismaTransaction): Promise<void> => {
      const now = new Date();

      await client.objectSessionState.update({
        where: { id: input.objectStateId },
        data: {
          inspected: true,
          inspectedAt: now,
          revealedClues:
            input.discoveredClueIds.length > 0
              ? {
                  connect: input.discoveredClueIds.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      if (input.discoveredClueIds.length > 0) {
        await client.sessionClue.updateMany({
          where: { id: { in: input.discoveredClueIds } },
          data: { discovered: true, discoveredAt: now },
        });
      }

      if (input.messages.length > 0) {
        await client.objectInteractionMessage.createMany({
          data: input.messages.map((message) => ({
            objectStateId: input.objectStateId,
            role: message.role,
            content: message.content,
          })),
        });
      }
    };

    if (tx) return run(tx);
    return this.runTransaction(run);
  }

  async recordCharacterInteraction(
    input: {
      characterStateId: string;
      conversationSummary: string;
      discoveredClueIds: string[];
      updatedSecretStates: UpdatedSecretState[];
      messages: { role: InteractionRole; content: string }[];
    },
    tx?: PrismaTransaction
  ): Promise<void> {
    const run = async (client: PrismaTransaction): Promise<void> => {
      const now = new Date();

      await client.characterSessionState.update({
        where: { id: input.characterStateId },
        data: {
          conversationSummary: input.conversationSummary,
          revealedClues:
            input.discoveredClueIds.length > 0
              ? {
                  connect: input.discoveredClueIds.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      for (const secret of input.updatedSecretStates) {
        await client.characterSecretSessionState.update({
          where: { id: secret.secretId },
          data: {
            currentStageLevel: secret.currentStageLevel,
            revealStages:
              secret.revealedStageIds.length > 0
                ? {
                    connect: secret.revealedStageIds.map((id) => ({ id })),
                  }
                : undefined,
            revealedClues:
              secret.revealedClueIds.length > 0
                ? {
                    connect: secret.revealedClueIds.map((id) => ({ id })),
                  }
                : undefined,
          },
        });
      }

      if (input.messages.length > 0) {
        await client.characterConversationMessage.createMany({
          data: input.messages.map((message) => ({
            characterStateId: input.characterStateId,
            role: message.role,
            content: message.content,
          })),
        });
      }

      if (input.discoveredClueIds.length > 0) {
        await client.sessionClue.updateMany({
          where: { id: { in: input.discoveredClueIds } },
          data: { discovered: true, discoveredAt: now },
        });
      }
    };

    if (tx) return run(tx);
    return this.runTransaction(run);
  }

  async recordLocationVisit(
    input: {
      locationStateId: string;
      revealedAmbientClueIds: string[];
      discoveredClueIds: string[];
    },
    tx?: PrismaTransaction
  ): Promise<void> {
    const run = async (client: PrismaTransaction): Promise<void> => {
      const now = new Date();

      await client.locationSessionState.update({
        where: { id: input.locationStateId },
        data: {
          visited: true,
          visitedAt: now,
          revealedAmbientClues:
            input.revealedAmbientClueIds.length > 0
              ? {
                  connect: input.revealedAmbientClueIds.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      if (input.discoveredClueIds.length > 0) {
        await client.sessionClue.updateMany({
          where: { id: { in: input.discoveredClueIds } },
          data: { discovered: true, discoveredAt: now },
        });
      }
    };

    if (tx) return run(tx);
    return this.runTransaction(run);
  }

  async submitConclusion(
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
  ): Promise<void> {
    const run = async (client: PrismaTransaction): Promise<void> => {
      const now = new Date();

      const _conclusion = await client.sessionConclusion.create({
        data: {
          sessionId: input.sessionId,
          submittedAt: now,
          answers: {
            create: input.answers.map((answer) => ({
              fieldId: answer.fieldId,
              optionId: answer.optionId,
            })),
          },
        },
      });

      const ending = await client.sessionEnding.create({
        data: {
          sessionId: input.sessionId,
          endingSnapshotId: input.endingSnapshotId,
        },
      });

      await client.sessionScore.create({
        data: {
          sessionEndingId: ending.id,
          discoveredClues: input.score.discoveredClues,
          totalClues: input.score.totalClues,
          requiredCluesDiscovered: input.score.requiredCluesDiscovered,
          totalRequiredClues: input.score.totalRequiredClues,
          correctAnswers: input.score.correctAnswers,
          totalAnswers: input.score.totalAnswers,
        },
      });

      await client.historySession.update({
        where: { id: input.sessionId },
        data: {
          status: 'completed',
          completedAt: now,
        },
      });
    };

    if (tx) return run(tx);
    return this.runTransaction(run);
  }
}
