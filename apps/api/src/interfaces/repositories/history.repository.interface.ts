import { History } from '../../models';
import { IBaseRepository } from './base.repository.interface';

export interface IHistoryRepository extends IBaseRepository {
  findById(historyId: string): History | undefined;
  findBySlug(slug: string): History | undefined;
  list(): History[];
}
