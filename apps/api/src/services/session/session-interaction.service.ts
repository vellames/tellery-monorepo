import {
  CharacterAgentResult,
  detectIntent,
  DetectedIntent,
  ObjectAgentDiscoveredClue,
  runCharacterAgent,
  runObjectAgent,
} from '../../engine';
import {
  IHistoryRepository,
  IHistorySessionRepository,
} from '../../interfaces';
import { InteractBody } from '../../types/http/session.validation';
import { addUnique } from '../../utils/array';
import { HttpError } from '../../utils/http-error';
import { StatusCodes } from 'http-status-codes';
import { resolveSessionState } from './session-state-resolver';

export class SessionInteractionService {
  constructor(
    private readonly histories: IHistoryRepository,
    private readonly sessions: IHistorySessionRepository
  ) {}

  async interact(sessionId: string, userId: string, input: InteractBody) {
    const session = this.sessions.findById(sessionId);
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

    const id = input.stateId;
    const resolvedState = resolveSessionState(session, id);

    if (!resolvedState) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        id,
        'session:errors.unknownSessionState'
      );
    }

    const history = this.histories.findById(session.historyId);
    if (!history) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        session.historyId,
        'session:errors.unknownHistory'
      );
    }

    let discoveredClueIds: string[] = [];

    if (resolvedState.type === 'location' && !resolvedState.state.visited) {
      const location = history.locations.find(
        (historyLocation) =>
          historyLocation.id === resolvedState.state.locationId
      );

      resolvedState.state.visited = true;
      resolvedState.state.visitedAt = new Date();
      session.progress.visitedLocationIds = addUnique(
        session.progress.visitedLocationIds,
        resolvedState.state.locationId
      );

      if (location) {
        discoveredClueIds = location.ambientClueIds.filter(
          (clueId) => !session.progress.discoveredClueIds.includes(clueId)
        );
        resolvedState.state.revealedAmbientClueIds = addUnique(
          resolvedState.state.revealedAmbientClueIds,
          ...location.ambientClueIds
        );
        session.progress.discoveredClueIds = addUnique(
          session.progress.discoveredClueIds,
          ...location.ambientClueIds
        );
      }
    }

    let detectedIntents: DetectedIntent[] = [];
    let characterAgentResult: CharacterAgentResult | null = null;
    let objectAgentDiscoveredClues: ObjectAgentDiscoveredClue[] = [];

    if (resolvedState.type !== 'location') {
      try {
        detectedIntents = await detectIntent({
          message: input.interaction,
          intents: history.intentDefinitions,
          language: history.language,
        });

        console.log('intent_detector_result', {
          sessionId: session.id,
          stateId: id,
          interaction: input.interaction,
          detectedIntents,
        });

        if (resolvedState.type === 'character') {
          const character = history.characters.find(
            (historyCharacter) =>
              historyCharacter.id === resolvedState.state.characterId
          );

          if (!character) {
            throw new HttpError(
              StatusCodes.NOT_FOUND,
              resolvedState.state.characterId,
              'session:errors.unknownCharacter'
            );
          }

          const recentConversation =
            this.sessions.getRecentCharacterConversation({
              sessionId: session.id,
              characterStateId: resolvedState.state.id,
            });

          characterAgentResult = await runCharacterAgent({
            character,
            characterState: resolvedState.state,
            clues: history.clues,
            detectedIntents,
            discoveredClueIds: session.progress.discoveredClueIds,
            interaction: input.interaction,
            recentConversation,
            language: history.language,
          });

          const characterDiscoveredClueIds =
            characterAgentResult.discoveredClues.map((clue) => clue.clueId);

          resolvedState.state.conversationSummary =
            characterAgentResult.updatedConversationSummary;
          resolvedState.state.secretStates =
            characterAgentResult.updatedSecretStates;
          resolvedState.state.revealedClueIds = addUnique(
            resolvedState.state.revealedClueIds,
            ...characterDiscoveredClueIds
          );
          session.progress.talkedToCharacterIds = addUnique(
            session.progress.talkedToCharacterIds,
            resolvedState.state.characterId
          );
          session.progress.discoveredClueIds = addUnique(
            session.progress.discoveredClueIds,
            ...characterDiscoveredClueIds
          );
          discoveredClueIds = addUnique(
            discoveredClueIds,
            ...characterDiscoveredClueIds
          );

          this.sessions.appendCharacterConversationMessage({
            sessionId: session.id,
            characterStateId: resolvedState.state.id,
            message: {
              role: 'user',
              content: input.interaction,
              createdAt: new Date(),
            },
          });
          this.sessions.appendCharacterConversationMessage({
            sessionId: session.id,
            characterStateId: resolvedState.state.id,
            message: {
              role: 'character',
              content: characterAgentResult.reply,
              createdAt: new Date(),
            },
          });

          console.log('character_agent_result', {
            sessionId: session.id,
            stateId: id,
            characterId: character.id,
            characterAgentResult,
          });
        } else if (resolvedState.type === 'object') {
          const object = history.objects.find(
            (historyObject) => historyObject.id === resolvedState.state.objectId
          );

          if (!object) {
            throw new HttpError(
              StatusCodes.NOT_FOUND,
              resolvedState.state.objectId,
              'session:errors.unknownObject'
            );
          }

          objectAgentDiscoveredClues = await runObjectAgent({
            object,
            clues: history.clues,
            detectedIntents,
            discoveredClueIds: session.progress.discoveredClueIds,
            language: history.language,
          });

          const objectDiscoveredClueIds = objectAgentDiscoveredClues.map(
            (clue) => clue.clueId
          );

          resolvedState.state.inspected = true;
          resolvedState.state.inspectedAt = new Date();
          resolvedState.state.revealedClueIds = addUnique(
            resolvedState.state.revealedClueIds,
            ...objectDiscoveredClueIds
          );
          session.progress.inspectedObjectIds = addUnique(
            session.progress.inspectedObjectIds,
            resolvedState.state.objectId
          );
          session.progress.discoveredClueIds = addUnique(
            session.progress.discoveredClueIds,
            ...objectDiscoveredClueIds
          );
          discoveredClueIds = addUnique(
            discoveredClueIds,
            ...objectDiscoveredClueIds
          );

          console.log('object_agent_result', {
            sessionId: session.id,
            stateId: id,
            objectId: object.id,
            objectAgentDiscoveredClues,
          });
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;

        throw new HttpError(
          StatusCodes.BAD_GATEWAY,
          error instanceof Error ? error.message : '',
          'session:errors.intentDetectionFailed'
        );
      }
    }

    const discoveredClues = history.clues.filter((clue) =>
      discoveredClueIds.includes(clue.id)
    );

    return {
      id,
      reply: characterAgentResult?.reply ?? null,
      detectedIntents,
      characterAgentResult,
      objectAgentDiscoveredClues,
      discoveredClues,
      sessionStatus: session.status,
      session,
    };
  }
}
