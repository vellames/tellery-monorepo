import { BaseModel, createBaseModel } from '../BaseModel';

export interface LocationSessionState extends BaseModel {
  locationId: string;
  visited: boolean;
  visitedAt?: Date;

  revealedAmbientClueIds: string[];
}

export function createLocationSessionState(input: {
  locationId: string;
}): LocationSessionState {
  return {
    ...createBaseModel(),
    locationId: input.locationId,
    visited: false,
    revealedAmbientClueIds: [],
  };
}
