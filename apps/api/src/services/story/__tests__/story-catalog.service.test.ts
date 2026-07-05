import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IStoryDefinitionRepository,
  IImageUrlSigner,
} from '../../../interfaces';
import type {
  StoryCatalogDetailItem,
  StoryCatalogItem,
} from '../../../repositories/StoryDefinitionRepository';
import { StoryCatalogService } from '../story-catalog.service';

const mockCatalogItem = (
  overrides: Partial<StoryCatalogItem> = {}
): StoryCatalogItem =>
  ({
    id: 'story-1',
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    genre: 'mystery',
    estimatedDurationMinutes: 10,
    isFree: true,
    coverImageUrl: 'stories/o-bilhete-na-mesa-7/story/cover.png',
    thumbnailUrl: 'stories/o-bilhete-na-mesa-7/story/thumbnail.png',
    ...overrides,
  }) as StoryCatalogItem;

const mockCatalogDetailItem = (
  overrides: Partial<StoryCatalogDetailItem> = {}
): StoryCatalogDetailItem =>
  ({
    ...mockCatalogItem(),
    opening: 'opening text',
    objective: 'objective text',
    ...overrides,
  }) as StoryCatalogDetailItem;

describe('StoryCatalogService', () => {
  let histories: DeepMockProxy<IStoryDefinitionRepository>;
  let imageUrlSigner: DeepMockProxy<IImageUrlSigner>;
  let service: StoryCatalogService;

  beforeEach(() => {
    histories = mockDeep<IStoryDefinitionRepository>();
    imageUrlSigner = mockDeep<IImageUrlSigner>();
    imageUrlSigner.sign.mockImplementation(async (key: string | null) =>
      key ? `https://signed.test/${key}` : null
    );
    service = new StoryCatalogService(histories, imageUrlSigner);
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
        'https://signed.test/stories/o-bilhete-na-mesa-7/story/cover.png'
      );
      expect(result.items[0].thumbnailUrl).toBe(
        'https://signed.test/stories/o-bilhete-na-mesa-7/story/thumbnail.png'
      );
      expect(imageUrlSigner.sign).toHaveBeenCalledWith(
        'stories/o-bilhete-na-mesa-7/story/cover.png'
      );
      expect(imageUrlSigner.sign).toHaveBeenCalledWith(
        'stories/o-bilhete-na-mesa-7/story/thumbnail.png'
      );
    });

    it('returns null image urls when the story has none', async () => {
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

    it('forwards the isFree filter to the repository when provided', async () => {
      histories.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.listAvailable(true, { page: 1, limit: 20 }, true);

      expect(histories.listPublished).toHaveBeenCalledWith(
        true,
        { page: 1, limit: 20 },
        true
      );
    });

    it('forwards isFree as undefined to the repository when omitted', async () => {
      histories.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.listAvailable(true, { page: 1, limit: 20 });

      expect(histories.listPublished).toHaveBeenCalledWith(
        true,
        { page: 1, limit: 20 },
        undefined
      );
    });
  });

  describe('getById', () => {
    it('returns the story with opening and objective and signed image urls', async () => {
      histories.findPublishedDetailById.mockResolvedValue(
        mockCatalogDetailItem()
      );

      const result = await service.getById('story-1');

      expect(histories.findPublishedDetailById).toHaveBeenCalledWith('story-1');
      expect(result.opening).toBe('opening text');
      expect(result.objective).toBe('objective text');
      expect(result.coverImageUrl).toBe(
        'https://signed.test/stories/o-bilhete-na-mesa-7/story/cover.png'
      );
      expect(result.thumbnailUrl).toBe(
        'https://signed.test/stories/o-bilhete-na-mesa-7/story/thumbnail.png'
      );
    });

    it('throws 404 when the story is not found', async () => {
      histories.findPublishedDetailById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
