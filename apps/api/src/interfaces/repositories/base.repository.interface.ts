import { PrismaTransaction } from '../../types/database.types';

export interface IBaseRepository {
  runTransaction<T>(
    callback: (tx: PrismaTransaction) => Promise<T>
  ): Promise<T>;
}
