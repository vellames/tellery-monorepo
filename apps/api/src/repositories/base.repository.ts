import { PrismaClient } from "@prisma/client";
import { IBaseRepository } from "../interfaces";
import { PrismaTransaction } from "../types/database.types";

export abstract class BaseRepository implements IBaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async runTransaction<T>(
    callback: (tx: PrismaTransaction) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }
}
