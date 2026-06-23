import { BaseModel } from '../BaseModel';

export interface CharacterDefinition extends BaseModel {
  name: string;
  role: string;
  shortDescription: string;

  imageUrl?: string;

  personality: string;
  speakingStyle: string;

  publicKnowledge: string[];
  privateKnowledge: string[];

  openingLine: string;

  clueRevealRules: CharacterClueRevealRule[];
  secrets: CharacterSecret[];

  conversationBoundaries: string[];
}

export interface CharacterClueRevealRule {
  clueId: string;
  triggerIntents: string[];
  requiresClueIds?: string[];
  revealText: string;
  responseGuidance: string;
}

export interface CharacterSecret extends BaseModel {
  summary: string;
  truth: string;

  defaultStrategy: SecretDefaultStrategy;

  revealStages: SecretRevealStage[];
}

export type SecretDefaultStrategy =
  | 'deny'
  | 'avoid'
  | 'deflect'
  | 'cover_story'
  | 'justify';

export interface SecretRevealStage extends BaseModel {
  level: number;

  triggerIntents: string[];
  requiresClueIds?: string[];
  revealsClueIds?: string[];

  behavior: string;
  allowedToRevealTruth: boolean;

  sampleResponses?: string[];
}
