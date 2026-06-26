import { GameApiClient, SessionStateResponse } from './api-client';
import { Investigator, PastAction } from './investigator';

export interface TurnLog {
  turn: number;
  stateType: string | null;
  entityName: string | null;
  stateId: string | null;
  reasoning: string;
  message: string | null;
  reply: string | null;
  discoveredClues: { title: string; description: string }[];
  error: string | null;
}

export interface RunResult {
  sessionId: string;
  historyTitle: string;
  turns: TurnLog[];
  discoveredClueCount: number;
  finalState: SessionStateResponse;
  stopReason: string;
}

const STALL_LIMIT = 4;

function resolveEntity(
  state: SessionStateResponse,
  stateId: string | null
): { type: string; name: string } | null {
  if (!stateId) return null;

  const character = state.characters.find((c) => c.id === stateId);
  if (character) return { type: 'character', name: character.name };

  const object = state.objects.find((o) => o.id === stateId);
  if (object) return { type: 'object', name: object.name };

  const location = state.locations.find((l) => l.id === stateId);
  if (location) return { type: 'location', name: location.name };

  return null;
}

export async function runSession(
  api: GameApiClient,
  investigator: Investigator,
  sessionId: string,
  maxIterations: number
): Promise<RunResult> {
  const turns: TurnLog[] = [];
  let state = await api.getSession(sessionId);
  let lastDiscoveredCount = state.clues.length;
  let stallTurns = 0;
  let stopReason = `max iterations (${maxIterations})`;
  const pastActions: PastAction[] = [];

  for (let turn = 1; turn <= maxIterations; turn++) {
    const action = await investigator.decide(state, pastActions);

    if (action.done) {
      console.log(`[turn ${turn}] investigator decided to stop: ${action.reasoning}`);
      stopReason = 'investigator decided to stop';
      break;
    }

    const entity = resolveEntity(state, action.stateId);
    console.log(
      `[turn ${turn}] -> ${entity?.type ?? '?'} / ${entity?.name ?? '?'}`
    );
    console.log(`  reasoning: ${action.reasoning}`);

    const turnLog: TurnLog = {
      turn,
      stateType: entity?.type ?? null,
      entityName: entity?.name ?? null,
      stateId: action.stateId,
      reasoning: action.reasoning,
      message: action.message,
      reply: null,
      discoveredClues: [],
      error: null,
    };

    if (!action.stateId || action.message === null) {
      turnLog.error = 'investigator returned an incomplete action';
      console.error(`  ERROR: ${turnLog.error}`);
      turns.push(turnLog);
      break;
    }

    try {
      const result = await api.interact(
        sessionId,
        action.stateId,
        action.message
      );
      turnLog.reply = result.reply;
      turnLog.discoveredClues = result.discoveredClues.map((clue) => ({
        title: clue.title,
        description: clue.description,
      }));

      console.log(`  sent:      ${action.message}`);
      if (result.reply) {
        console.log(`  reply:     ${result.reply}`);
      }
      if (result.discoveredClues.length > 0) {
        console.log(
          `  discovered: ${result.discoveredClues.map((c) => c.title).join(', ')}`
        );
      }

      pastActions.push({
        turn,
        entityType: entity?.type ?? 'unknown',
        entityName: entity?.name ?? 'unknown',
        message: action.message,
        reply: result.reply,
        discoveredClues: result.discoveredClues.map((c) => c.title),
      });
    } catch (error) {
      turnLog.error = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: ${turnLog.error}`);
      turns.push(turnLog);
      stopReason = `interact error: ${turnLog.error}`;
      break;
    }

    turns.push(turnLog);

    state = await api.getSession(sessionId);
    console.log(`  progress:  ${state.clues.length} clues discovered so far`);

    if (state.clues.length > lastDiscoveredCount) {
      lastDiscoveredCount = state.clues.length;
      stallTurns = 0;
    } else {
      stallTurns += 1;
      if (stallTurns >= STALL_LIMIT) {
        stopReason = `no new clues for ${STALL_LIMIT} turns`;
        break;
      }
    }
  }

  return {
    sessionId,
    historyTitle: state.history.title,
    turns,
    discoveredClueCount: state.clues.length,
    finalState: state,
    stopReason,
  };
}
