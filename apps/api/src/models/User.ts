import { BaseModel, createBaseModel } from "./BaseModel";

export interface User extends BaseModel {
  name: string;
  email: string;
  password: string;
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
}): User {
  return {
    ...createBaseModel(),
    name: input.name,
    email: input.email,
    password: input.password,
  };
}
