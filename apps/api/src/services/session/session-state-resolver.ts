import type { HistorySessionWithRelations } from '../../repositories/SessionRepository';

type CharacterState = HistorySessionWithRelations['characterStates'][number];
type ObjectState = HistorySessionWithRelations['objectStates'][number];
type LocationState = HistorySessionWithRelations['locationStates'][number];

export type ResolvedSessionState =
  | { type: 'character'; state: CharacterState }
  | { type: 'object'; state: ObjectState }
  | { type: 'location'; state: LocationState };

export function resolveSessionState(
  session: HistorySessionWithRelations,
  stateId: string
): ResolvedSessionState | undefined {
  const characterState = session.characterStates.find(
    (state) => state.id === stateId
  );
  if (characterState) return { type: 'character', state: characterState };

  const objectState = session.objectStates.find(
    (state) => state.id === stateId
  );
  if (objectState) return { type: 'object', state: objectState };

  const locationState = session.locationStates.find(
    (state) => state.id === stateId
  );
  if (locationState) return { type: 'location', state: locationState };

  return undefined;
}
