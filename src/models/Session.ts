import { BaseModel, createBaseModel } from "./BaseModel";
import { CharacterSessionState } from "./CharacterSessionState";
import { LocationSessionState } from "./LocationSessionState";
import { ObjectSessionState } from "./ObjectSessionState";

export interface HistorySession extends BaseModel {
  userId: string;
  historyId: string;
  historyVersion: number;

  status: "active" | "completed" | "abandoned";

  startedAt: Date;
  completedAt?: Date;

  progress: HistorySessionProgress;

  characterStates: CharacterSessionState[];
  locationStates: LocationSessionState[];
  objectStates: ObjectSessionState[];

  conclusion?: UserConclusion;
  ending?: SessionEnding;

  usage: SessionUsage;
}

export interface HistorySessionProgress {
  discoveredClueIds: string[];

  visitedLocationIds: string[];
  inspectedObjectIds: string[];
  talkedToCharacterIds: string[];

  currentTarget?: SessionTarget;

  interactionCount: number;
}

export interface SessionTarget {
  type: "character" | "location" | "object";
  id: string;
}

export interface UserConclusion {
  submittedAt: Date;
  answers: Record<string, string>;
}

export interface SessionEnding {
  endingId: string;
  title: string;
  type: "full_truth" | "partial_truth" | "wrong_accusation";

  score?: SessionScore;
}

export interface SessionScore {
  discoveredClues: number;
  totalClues: number;
  requiredCluesDiscovered: number;
  totalRequiredClues: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface SessionUsage {
  // TODO
}

export function createHistorySession(input: {
  userId: string;
  historyId: string;
  historyVersion: number;
}): HistorySession {
  return {
    ...createBaseModel(),
    userId: input.userId,
    historyId: input.historyId,
    historyVersion: input.historyVersion,
    status: "active",
    startedAt: new Date(),
    progress: {
      discoveredClueIds: [],
      visitedLocationIds: [],
      inspectedObjectIds: [],
      talkedToCharacterIds: [],
      interactionCount: 0,
    },
    characterStates: [],
    locationStates: [],
    objectStates: [],
    usage: {},
  };
}
