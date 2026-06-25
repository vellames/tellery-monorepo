import { PrismaClient, Prisma, HistorySession } from '@prisma/client';
import { ISessionRepository } from '../interfaces';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export const historySessionInclude = {
  clues: true,
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
} satisfies Prisma.HistorySessionInclude;

export type HistorySessionWithRelations = Prisma.HistorySessionGetPayload<{
  include: typeof historySessionInclude;
}>;

export class SessionRepository
  extends BaseRepository
  implements ISessionRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
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

  async list(
    userId?: string,
    tx?: PrismaTransaction
  ): Promise<HistorySession[]> {
    const client = tx ?? this.prisma;
    const where = userId
      ? { deletedAt: null, userId }
      : { deletedAt: null };

    return client.historySession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
