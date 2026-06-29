import { EndingType } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '../../interfaces';
import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';
import { ConclusionBody } from '../../types/http/session.validation';
import { HttpError } from '../../utils/http-error';

const ENDING_PRIORITY: Record<EndingType, number> = {
  full_truth: 3,
  partial_truth: 2,
  wrong_accusation: 1,
};

export interface ConclusionScoreDto {
  discoveredClues: number;
  totalClues: number;
  requiredCluesDiscovered: number;
  totalRequiredClues: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface ConclusionEndingDto {
  id: string;
  endingDefinitionId: string;
  title: string;
  type: EndingType;
  imageUrl: string | null;
  summary: string;
  epilogue: string;
}

export interface ConclusionResult {
  ending: ConclusionEndingDto;
  score: ConclusionScoreDto;
}

export class SessionConclusionService {
  constructor(private readonly sessions: ISessionRepository) {}

  async submit(
    sessionId: string,
    userId: string,
    input: ConclusionBody
  ): Promise<ConclusionResult> {
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

    if (session.status === 'completed') {
      throw new HttpError(
        StatusCodes.CONFLICT,
        sessionId,
        'session:errors.sessionAlreadyCompleted'
      );
    }

    const requiredCluesTotal = session.clues.filter(
      (clue) => clue.importance === 'required'
    ).length;
    const requiredCluesDiscovered = session.clues.filter(
      (clue) => clue.importance === 'required' && clue.discovered
    ).length;

    if (requiredCluesDiscovered < requiredCluesTotal) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        sessionId,
        'session:errors.requiredCluesNotDiscovered'
      );
    }

    const answersByFieldDefId = this.buildAnswersMap(session, input.answers);
    const discoveredClueIds = new Set(
      session.clues.filter((c) => c.discovered).map((c) => c.id)
    );

    const chosenEnding = this.resolveEnding(
      session,
      answersByFieldDefId,
      discoveredClueIds
    );

    const score = this.computeScore(session, chosenEnding, answersByFieldDefId);

    await this.sessions.submitConclusion({
      sessionId: session.id,
      endingSnapshotId: chosenEnding.id,
      answers: input.answers.map((a) => ({
        fieldId: a.fieldId,
        optionId: a.optionId,
      })),
      score,
    });

    return {
      ending: {
        id: chosenEnding.id,
        endingDefinitionId: chosenEnding.endingDefinitionId,
        title: chosenEnding.title,
        type: chosenEnding.type,
        imageUrl: chosenEnding.imageUrl,
        summary: chosenEnding.summary,
        epilogue: chosenEnding.epilogue,
      },
      score,
    };
  }

  private buildAnswersMap(
    session: HistorySessionWithRelations,
    answers: { fieldId: string; optionId: string }[]
  ): Record<string, string> {
    const map: Record<string, string> = {};

    for (const answer of answers) {
      const field = session.conclusionFields.find(
        (f) => f.id === answer.fieldId
      );
      if (!field) {
        throw new HttpError(
          StatusCodes.NOT_FOUND,
          answer.fieldId,
          'session:errors.unknownConclusionField'
        );
      }

      const option = field.options.find((o) => o.id === answer.optionId);
      if (!option) {
        throw new HttpError(
          StatusCodes.NOT_FOUND,
          answer.optionId,
          'session:errors.unknownConclusionOption'
        );
      }

      map[field.fieldDefinitionId] = option.optionDefinitionId;
    }

    return map;
  }

  private resolveEnding(
    session: HistorySessionWithRelations,
    answersByFieldDefId: Record<string, string>,
    discoveredClueIds: Set<string>
  ): HistorySessionWithRelations['endingSnapshots'][number] {
    const eligible = session.endingSnapshots.filter((snapshot) => {
      const matches = this.matchesConclusion(
        snapshot.conclusionMatches as Record<string, string>,
        answersByFieldDefId
      );
      const hasRequiredClues = snapshot.requiredClues.every((clue) =>
        discoveredClueIds.has(clue.id)
      );
      return matches && hasRequiredClues;
    });

    if (eligible.length === 0) {
      const fallback = session.endingSnapshots.find(
        (s) => s.type === 'wrong_accusation'
      );
      if (!fallback) {
        throw new HttpError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          session.id,
          'session:errors.noEndingMatched'
        );
      }
      return fallback;
    }

    eligible.sort((a, b) => ENDING_PRIORITY[b.type] - ENDING_PRIORITY[a.type]);
    return eligible[0];
  }

  private matchesConclusion(
    conclusionMatches: Record<string, string>,
    answersByFieldDefId: Record<string, string>
  ): boolean {
    const keys = Object.keys(conclusionMatches);
    if (keys.length === 0) return true;

    return keys.every(
      (fieldDefId) =>
        answersByFieldDefId[fieldDefId] === conclusionMatches[fieldDefId]
    );
  }

  private computeScore(
    session: HistorySessionWithRelations,
    ending: HistorySessionWithRelations['endingSnapshots'][number],
    answersByFieldDefId: Record<string, string>
  ): ConclusionScoreDto {
    const discoveredClues = session.clues.filter((c) => c.discovered).length;
    const totalClues = session.clues.length;
    const requiredCluesDiscovered = session.clues.filter(
      (c) => c.importance === 'required' && c.discovered
    ).length;
    const totalRequiredClues = session.clues.filter(
      (c) => c.importance === 'required'
    ).length;

    const conclusionMatches = ending.conclusionMatches as Record<
      string,
      string
    >;
    const matchKeys = Object.keys(conclusionMatches);
    const correctAnswers = matchKeys.filter(
      (fieldDefId) =>
        answersByFieldDefId[fieldDefId] === conclusionMatches[fieldDefId]
    ).length;

    return {
      discoveredClues,
      totalClues,
      requiredCluesDiscovered,
      totalRequiredClues,
      correctAnswers,
      totalAnswers: session.conclusionFields.length,
    };
  }
}
