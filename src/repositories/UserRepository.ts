import { User } from "../models";
import { loadMockJson } from "./mockLoader";

export class UserRepository {
  private readonly users = loadMockJson<User[]>("users.json");

  findById(userId: string): User | undefined {
    return this.users.find((user) => user.id === userId && !user.deletedAt);
  }

  list(): User[] {
    return this.users.filter((user) => !user.deletedAt);
  }
}
