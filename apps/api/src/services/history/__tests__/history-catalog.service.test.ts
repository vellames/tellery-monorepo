import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { IHistoryDefinitionRepository } from '../../../interfaces';
import type { HistoryCatalogItem } from '../../../repositories/HistoryDefinitionRepository';
import { HistoryCatalogService } from '../history-catalog.service';

const mockCatalogItem = (
  overrides: Partial<HistoryCatalogItem> = {}
): HistoryCatalogItem =>
  ({
    id: 'history-1',
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    genre: 'mystery',
    estimatedDurationMinutes: 10,
    isFree: true,
    coverImageUrl: null,
    thumbnailUrl: null,
    ...overrides,
  }) as HistoryCatalogItem;

describe('HistoryCatalogService', () => {
  let histories: DeepMockProxy<IHistoryDefinitionRepository>;
  let service: HistoryCatalogService;

  beforeEach(() => {
    histories = mockDeep<IHistoryDefinitionRepository>();
    service = new HistoryCatalogService(histories);
  });

  afterEach(() => {
    mockReset(histories);
  });

  describe('listAvailable', () => {
    it('returns featured histories mapped to catalog dtos within a paginated result', async () => {
      const items = [mockCatalogItem({ id: 'history-1' })];
      histories.listPublished.mockResolvedValue({
        items,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listAvailable(true, { page: 1, limit: 20 });

      expect(histories.listPublished).toHaveBeenCalledWith(true, {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: 'history-1',
            slug: 'o-bilhete-na-mesa-7',
            title: 'O Bilhete na Mesa 7',
            subtitle: null,
            teaser: 'teaser',
            genre: 'mystery',
            estimatedDurationMinutes: 10,
            isFree: true,
            coverImageUrl: null,
            thumbnailUrl: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('maps each item and preserves the pagination metadata', async () => {
      histories.listPublished.mockResolvedValue({
        items: [
          mockCatalogItem({ id: 'a' }),
          mockCatalogItem({ id: 'b' }),
        ],
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      });

      const result = await service.listAvailable(false, {
        page: 2,
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b']);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });
});
