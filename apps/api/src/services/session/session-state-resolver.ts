import {
  CharacterSessionState,
  HistorySession,
  LocationSessionState,
  ObjectSessionState,
} from "../../models";

export type ResolvedSessionState =
  | { type: "character"; state: CharacterSessionState }
  | { type: "object"; state: ObjectSessionState }
  | { type: "location"; state: LocationSessionState };

export function resolveSessionState(
  session: HistorySession,
  stateId: string
): ResolvedSessionState | undefined {
  const characterState = session.characterStates.find(
    (state) => state.id === stateId
  );
  if (characterState) return { type: "character", state: characterState };

  const objectState = session.objectStates.find(
    (state) => state.id === stateId
  );
  if (objectState) return { type: "object", state: objectState };

  const locationState = session.locationStates.find(
    (state) => state.id === stateId
  );
  if (locationState) return { type: "location", state: locationState };

  return undefined;
}
