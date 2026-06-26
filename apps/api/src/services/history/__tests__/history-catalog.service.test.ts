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
    it('returns published histories mapped to catalog dtos', async () => {
      histories.listPublished.mockResolvedValue([
        mockCatalogItem({ id: 'history-1' }),
        mockCatalogItem({
          id: 'history-2',
          slug: 'o-fantasma-do-rio',
          title: 'O Fantasma do Rio',
          subtitle: 'Uma lenda local',
          coverImageUrl: 'https://example.com/cover.png',
        }),
      ]);

      const result = await service.listAvailable();

      expect(histories.listPublished).toHaveBeenCalledWith();
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
        {
          id: 'history-2',
          slug: 'o-fantasma-do-rio',
          title: 'O Fantasma do Rio',
          subtitle: 'Uma lenda local',
          teaser: 'teaser',
          genre: 'mystery',
          estimatedDurationMinutes: 10,
          coverImageUrl: 'https://example.com/cover.png',
          thumbnailUrl: null,
        },
      ]);
    });

    it('returns empty array when there are no published histories', async () => {
      histories.listPublished.mockResolvedValue([]);

      const result = await service.listAvailable();

      expect(result).toEqual([]);
    });
  });
});
