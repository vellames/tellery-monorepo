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

  it('returns 200 with a paginated result of featured histories', async () => {
    const paginated = {
      items: [
        {
          id: 'history-1',
          slug: 'o-bilhete-na-mesa-7',
          title: 'O Bilhete na Mesa 7',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    historyCatalogService.listAvailable.mockResolvedValue(paginated as never);
    req = {
      query: { isFeatured: 'true' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(
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
    historyCatalogService.listAvailable.mockResolvedValue({
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

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(
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
    historyCatalogService.listAvailable.mockResolvedValue({
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

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(
      true,
      { page: 1, limit: 20 },
      true
    );
  });

  it('passes isFree=false through as the third argument', async () => {
    historyCatalogService.listAvailable.mockResolvedValue({
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

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith(
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

  it('returns 422 when isFree query parameter is invalid', async () => {
    req = {
      query: { isFeatured: 'true', isFree: 'yes' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('returns 422 when limit exceeds the maximum', async () => {
    req = {
      query: { isFeatured: 'true', limit: '999' },
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

describe('HistoryController - getById', () => {
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

  it('returns 200 with the requested history', async () => {
    const history = {
      id: 'history-1',
      slug: 'o-bilhete-na-mesa-7',
      title: 'O Bilhete na Mesa 7',
    };
    historyCatalogService.getById.mockResolvedValue(history as never);
    req = {
      params: { historyId: 'history-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(historyCatalogService.getById).toHaveBeenCalledWith('history-1');
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: history,
      message: undefined,
    });
  });

  it('returns 404 when the history does not exist', async () => {
    const { HttpError } = await import('../../utils/http-error');
    historyCatalogService.getById.mockRejectedValue(
      new HttpError(
        StatusCodes.NOT_FOUND,
        'missing',
        'session:errors.unknownHistory'
      )
    );
    req = {
      params: { historyId: 'missing' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it('returns 500 on unexpected errors', async () => {
    historyCatalogService.getById.mockRejectedValue(new Error('boom'));
    req = {
      params: { historyId: 'history-1' },
      user: { id: 'user-1', email: 'ana@teste.local' },
      t,
    };

    await controller.getById(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
