import { User } from "../models";
import { IUserRepository } from "../interfaces";
import { loadMockJson } from "./mockLoader";

export class UserRepository implements IUserRepository {
  private readonly users = loadMockJson<User[]>("users.json");

  findById(userId: string): User | undefined {
    return this.users.find((user) => user.id === userId && !user.deletedAt);
  }

  list(): User[] {
    return this.users.filter((user) => !user.deletedAt);
  }
}
