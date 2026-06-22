import { BaseModel, createBaseModel } from "./BaseModel";

export interface CharacterSessionState extends BaseModel {
  characterId: string;

  conversationSummary?: string;
  lastInteractionIds: string[];

  revealedClueIds: string[];

  secretStates: CharacterSecretSessionState[];
}

export interface CharacterSecretSessionState {
  secretId: string;

  currentStageLevel: number;
  revealedStageIds: string[];

  revealedClueIds: string[];
}

export function createCharacterSessionState(input: {
  characterId: string;
}): CharacterSessionState {
  return {
    ...createBaseModel(),
    characterId: input.characterId,
    lastInteractionIds: [],
    revealedClueIds: [],
    secretStates: [],
  };
}
