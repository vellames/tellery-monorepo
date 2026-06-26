import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { HistoryController } from '../history.controller';
import { HistoryCatalogService } from '../../services/history/history-catalog.service';
import { TranslationFunction } from '../../types/i18n.types';

describe('HistoryController - list', () => {
  let historyCatalogService: DeepMockProxy<HistoryCatalogService>;
  let controller: HistoryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    historyCatalogService = mockDeep<HistoryCatalogService>();
    controller = new HistoryController(historyCatalogService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(historyCatalogService);
  });

  it('returns 200 with featured histories when isFeatured=true', async () => {
    const histories = [
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
    ];
    historyCatalogService.listAvailable.mockResolvedValue(histories);
    req = {
      query: { isFeatured: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(true);
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: histories,
      message: undefined,
    });
  });

  it('passes isFeatured=false to the service when query is false', async () => {
    historyCatalogService.listAvailable.mockResolvedValue([]);
    req = {
      query: { isFeatured: 'false' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(false);
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('returns 422 when isFeatured query parameter is missing', async () => {
    req = {
      query: {},
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 422 when isFeatured query parameter is invalid', async () => {
    req = {
      query: { isFeatured: 'yes' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 500 on unexpected errors', async () => {
    historyCatalogService.listAvailable.mockRejectedValue(new Error('boom'));
    req = {
      query: { isFeatured: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
