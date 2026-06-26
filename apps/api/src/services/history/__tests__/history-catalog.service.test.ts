import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IHistoryDefinitionRepository,
  IImageUrlSigner,
} from '../../../interfaces';
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
    coverImageUrl: 'histories/o-bilhete-na-mesa-7/history/cover.png',
    thumbnailUrl: 'histories/o-bilhete-na-mesa-7/history/thumbnail.png',
    ...overrides,
  }) as HistoryCatalogItem;

describe('HistoryCatalogService', () => {
  let histories: DeepMockProxy<IHistoryDefinitionRepository>;
  let imageUrlSigner: DeepMockProxy<IImageUrlSigner>;
  let service: HistoryCatalogService;

  beforeEach(() => {
    histories = mockDeep<IHistoryDefinitionRepository>();
    imageUrlSigner = mockDeep<IImageUrlSigner>();
    imageUrlSigner.sign.mockImplementation(async (key: string | null) =>
      key ? `https://signed.test/${key}` : null
    );
    service = new HistoryCatalogService(histories, imageUrlSigner);
  });

  afterEach(() => {
    mockReset(histories);
    mockReset(imageUrlSigner);
  });

  describe('listAvailable', () => {
    it('returns featured histories with signed cover and thumbnail urls', async () => {
      histories.listPublished.mockResolvedValue({
        items: [mockCatalogItem()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listAvailable(true, { page: 1, limit: 20 });

      expect(result.items[0].coverImageUrl).toBe(
        'https://signed.test/histories/o-bilhete-na-mesa-7/history/cover.png'
      );
      expect(result.items[0].thumbnailUrl).toBe(
        'https://signed.test/histories/o-bilhete-na-mesa-7/history/thumbnail.png'
      );
      expect(imageUrlSigner.sign).toHaveBeenCalledWith(
        'histories/o-bilhete-na-mesa-7/history/cover.png'
      );
      expect(imageUrlSigner.sign).toHaveBeenCalledWith(
        'histories/o-bilhete-na-mesa-7/history/thumbnail.png'
      );
    });

    it('returns null image urls when the history has none', async () => {
      histories.listPublished.mockResolvedValue({
        items: [mockCatalogItem({ coverImageUrl: null, thumbnailUrl: null })],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listAvailable(true, { page: 1, limit: 20 });

      expect(result.items[0].coverImageUrl).toBeNull();
      expect(result.items[0].thumbnailUrl).toBeNull();
    });

    it('preserves the pagination metadata', async () => {
      histories.listPublished.mockResolvedValue({
        items: [mockCatalogItem({ id: 'a' }), mockCatalogItem({ id: 'b' })],
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      });

      const result = await service.listAvailable(false, {
        page: 2,
        limit: 2,
      });

      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.items.map((i) => i.id)).toEqual(['a', 'b']);
    });
  });
});
