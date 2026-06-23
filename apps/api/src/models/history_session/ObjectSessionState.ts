import { BaseModel, createBaseModel } from '../BaseModel';

export interface ObjectSessionState extends BaseModel {
  objectId: string;
  inspected: boolean;
  inspectedAt?: Date;

  revealedClueIds: string[];
}

export function createObjectSessionState(input: {
  objectId: string;
}): ObjectSessionState {
  return {
    ...createBaseModel(),
    objectId: input.objectId,
    inspected: false,
    revealedClueIds: [],
  };
}
