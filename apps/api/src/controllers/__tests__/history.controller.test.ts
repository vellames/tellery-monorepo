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

  it('returns 200 with the available histories', async () => {
    const histories = [
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
    ];
    historyCatalogService.listAvailable.mockResolvedValue(histories);
    req = { user: { id: 'user-1', email: 'ana@teste.local' }, t };

    await controller.list(req as Request, res as Response);

    expect(historyCatalogService.listAvailable).toHaveBeenCalledWith();
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: histories,
      message: undefined,
    });
  });

  it('returns 200 with empty array when no histories exist', async () => {
    historyCatalogService.listAvailable.mockResolvedValue([]);
    req = { user: { id: 'user-1', email: 'ana@teste.local' }, t };

    await controller.list(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: [],
      message: undefined,
    });
  });

  it('returns 500 on unexpected errors', async () => {
    historyCatalogService.listAvailable.mockRejectedValue(new Error('boom'));
    req = { user: { id: 'user-1', email: 'ana@teste.local' }, t };

    await controller.list(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
