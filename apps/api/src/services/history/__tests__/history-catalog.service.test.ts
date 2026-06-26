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
    it('requests featured histories and maps them to catalog dtos', async () => {
      histories.listPublished.mockResolvedValue([
        mockCatalogItem({ id: 'history-1' }),
      ]);

      const result = await service.listAvailable(true);

      expect(histories.listPublished).toHaveBeenCalledWith(true);
      expect(result).toEqual([
        {
          id: 'history-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
          subtitle: null,
          teaser: 'teaser',
          genre: 'mystery',
          estimatedDurationMinutes: 10,
          coverImageUrl: null,
          thumbnailUrl: null,
        },
      ]);
    });

    it('requests non-featured histories when isFeatured is false', async () => {
      histories.listPublished.mockResolvedValue([]);

      await service.listAvailable(false);

      expect(histories.listPublished).toHaveBeenCalledWith(false);
    });
  });
});
