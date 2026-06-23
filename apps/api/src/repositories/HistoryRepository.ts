import { History } from "../models";
import { IHistoryRepository } from "../interfaces";
import { loadMockJson } from "./mockLoader";

export class HistoryRepository implements IHistoryRepository {
  private readonly histories = [
    loadMockJson<History>("o-bilhete-na-mesa-7.json"),
  ];

  findDefault(): History | undefined {
    return this.histories[0];
  }

  findById(historyId: string): History | undefined {
    return this.histories.find(
      (history) => history.id === historyId && !history.deletedAt
    );
  }

  findBySlug(slug: string): History | undefined {
    return this.histories.find(
      (history) => history.slug === slug && !history.deletedAt
    );
  }

  list(): History[] {
    return this.histories.filter((history) => !history.deletedAt);
  }
}
