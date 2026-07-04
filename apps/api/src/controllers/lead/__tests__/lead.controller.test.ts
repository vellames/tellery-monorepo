import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { LeadController } from '../lead.controller';
import { LeadService } from '../../../services/lead/lead.service';
import { HttpError } from '../../../utils/http-error';
import { TranslationFunction } from '../../../types/i18n.types';

const leadDto = {
  id: 'lead-1',
  localUuid: 'browser-uuid-1',
  queryParams: null,
  deviceInfo: null,
  name: null,
  email: null,
  isFirstInputFocus: false,
  isPasswordTouched: false,
  isConfirmPasswordTouched: false,
  isPrivacyAccepted: false,
  isTermsAccepted: false,
  userId: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('LeadController', () => {
  let leadService: DeepMockProxy<LeadService>;
  let controller: LeadController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    leadService = mockDeep<LeadService>();
    controller = new LeadController(leadService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(leadService);
  });

  describe('create', () => {
    it('should return 201 with the lead when body is valid', async () => {
      leadService.createOrGetActive.mockResolvedValue(leadDto);
      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        timezone: 'America/Sao_Paulo',
      };
      req = {
        body: {
          localUuid: 'browser-uuid-1',
          queryParams: '?ref=x',
          deviceInfo,
        },
        t,
      };

      await controller.create(req as Request, res as Response);

      expect(leadService.createOrGetActive).toHaveBeenCalledWith({
        localUuid: 'browser-uuid-1',
        queryParams: '?ref=x',
        deviceInfo,
      });
      expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: leadDto,
        message: undefined,
      });
    });

    it('should return 422 when localUuid is missing', async () => {
      req = { body: { queryParams: '?ref=x' }, t };

      await controller.create(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(leadService.createOrGetActive).not.toHaveBeenCalled();
    });

    it('should return 500 on an unexpected error', async () => {
      leadService.createOrGetActive.mockRejectedValue(new Error('boom'));
      req = { body: { localUuid: 'browser-uuid-1' }, t };

      await controller.create(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('update', () => {
    it('should return 200 with the updated lead', async () => {
      const updated = { ...leadDto, name: 'Ana', isTermsAccepted: true };
      leadService.update.mockResolvedValue(updated);
      req = {
        params: { id: 'lead-1' },
        body: { name: 'Ana', isTermsAccepted: true },
        t,
      };

      await controller.update(req as Request, res as Response);

      expect(leadService.update).toHaveBeenCalledWith('lead-1', {
        name: 'Ana',
        isTermsAccepted: true,
      });
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: updated,
        message: undefined,
      });
    });

    it('should return 404 when the lead does not exist', async () => {
      leadService.update.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'Lead not found',
          'lead:errors.notFound'
        )
      );
      req = {
        params: { id: 'nonexistent' },
        body: { name: 'Ana' },
        t,
      };

      await controller.update(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 422 when body is invalid', async () => {
      req = {
        params: { id: 'lead-1' },
        body: { forbidden: true },
        t,
      };

      await controller.update(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(leadService.update).not.toHaveBeenCalled();
    });
  });
});
