import { User } from "../../models";
import { IBaseRepository } from "./base.repository.interface";

export interface IUserRepository extends IBaseRepository {
  findById(userId: string): User | undefined;
  list(): User[];
}
