import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { StoryController } from '../story.controller';
import { StoryCatalogService } from '../../services/story/story-catalog.service';
import { TranslationFunction } from '../../types/i18n.types';

describe('StoryController - list', () => {
  let storyCatalogService: DeepMockProxy<StoryCatalogService>;
  let controller: StoryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storyCatalogService = mockDeep<StoryCatalogService>();
    controller = new StoryController(storyCatalogService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storyCatalogService);
  });

  it('returns 200 with a paginated result of featured stories', async () => {
    const paginated = {
      items: [
        {
          id: 'story-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    storyCatalogService.listAvailable.mockResolvedValue(paginated as never);
    req = {
      query: { isFeatured: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).toHaveBeenCalledWith(
      true,
      {
        page: 1,
        limit: 20,
      },
      undefined
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: paginated,
      message: undefined,
    });
  });

  it('passes through provided page and limit', async () => {
    storyCatalogService.listAvailable.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    });
    req = {
      query: { isFeatured: 'false', page: '2', limit: '5' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).toHaveBeenCalledWith(
      false,
      {
        page: 2,
        limit: 5,
      },
      undefined
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('passes isFree=true through as the third argument', async () => {
    storyCatalogService.listAvailable.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    req = {
      query: { isFeatured: 'true', isFree: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).toHaveBeenCalledWith(
      true,
      { page: 1, limit: 20 },
      true
    );
  });

  it('passes isFree=false through as the third argument', async () => {
    storyCatalogService.listAvailable.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    req = {
      query: { isFeatured: 'true', isFree: 'false' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).toHaveBeenCalledWith(
      true,
      { page: 1, limit: 20 },
      false
    );
  });

  it('returns 422 when isFeatured query parameter is missing', async () => {
    req = {
      query: { page: '1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 422 when isFeatured query parameter is invalid', async () => {
    req = {
      query: { isFeatured: 'yes' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 422 when isFree query parameter is invalid', async () => {
    req = {
      query: { isFeatured: 'true', isFree: 'yes' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 422 when limit exceeds the maximum', async () => {
    req = {
      query: { isFeatured: 'true', limit: '999' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(storyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 500 on unexpected errors', async () => {
    storyCatalogService.listAvailable.mockRejectedValue(new Error('boom'));
    req = {
      query: { isFeatured: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe('StoryController - getById', () => {
  let storyCatalogService: DeepMockProxy<StoryCatalogService>;
  let controller: StoryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storyCatalogService = mockDeep<StoryCatalogService>();
    controller = new StoryController(storyCatalogService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storyCatalogService);
  });

  it('returns 200 with the requested story', async () => {
    const story = {
      id: 'story-1',
      slug: 'o-bilhete-na-mesa-7',
      title: 'O Bilhete na Mesa 7',
    };
    storyCatalogService.getById.mockResolvedValue(story as never);
    req = {
      params: { storyId: 'story-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(storyCatalogService.getById).toHaveBeenCalledWith('story-1');
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: story,
      message: undefined,
    });
  });

  it('returns 404 when the story does not exist', async () => {
    const { HttpError } = await import('../../utils/http-error');
    storyCatalogService.getById.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'missing',
        'session:errors.unknownStory'
      )
    );
    req = {
      params: { storyId: 'missing' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it('returns 500 on unexpected errors', async () => {
    storyCatalogService.getById.mockRejectedValue(new Error('boom'));
    req = {
      params: { storyId: 'story-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe('StoryController - getBySlug', () => {
  let storyCatalogService: DeepMockProxy<StoryCatalogService>;
  let controller: StoryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    storyCatalogService = mockDeep<StoryCatalogService>();
    controller = new StoryController(storyCatalogService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(storyCatalogService);
  });

  it('returns 200 with the requested story', async () => {
    const story = {
      id: 'story-1',
      slug: 'o-bilhete-na-mesa-7',
      title: 'O Bilhete na Mesa 7',
    };
    storyCatalogService.getBySlug.mockResolvedValue(story as never);
    req = {
      params: { slug: 'o-bilhete-na-mesa-7' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getBySlug(req as Request, res as Response);

    expect(storyCatalogService.getBySlug).toHaveBeenCalledWith(
      'o-bilhete-na-mesa-7'
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: story,
      message: undefined,
    });
  });

  it('returns 404 when the story does not exist', async () => {
    const { HttpError } = await import('../../utils/http-error');
    storyCatalogService.getBySlug.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'missing',
        'session:errors.unknownStory'
      )
    );
    req = {
      params: { slug: 'missing' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getBySlug(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it('returns 500 on unexpected errors', async () => {
    storyCatalogService.getBySlug.mockRejectedValue(new Error('boom'));
    req = {
      params: { slug: 'o-bilhete-na-mesa-7' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getBySlug(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
