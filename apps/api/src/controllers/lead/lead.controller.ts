import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { LeadService } from '../../services/lead/lead.service';
import {
  createLeadSchema,
  updateLeadSchema,
} from '../../types/domain/lead/lead.validation';
import { HttpError } from '../../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../../utils/response.utils';
import { TranslationFunction } from '../../types/i18n.types';

export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = createLeadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const lead = await this.leadService.createOrGetActive(parsed.data);
      sendSuccess(res, lead, undefined, StatusCodes.CREATED);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = updateLeadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const lead = await this.leadService.update(
        String(req.params.id),
        parsed.data
      );
      sendSuccess(res, lead);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  private handleControllerError = (
    req: Request,
    res: Response,
    error: unknown
  ): void => {
    const t = req.t as TranslationFunction;
    if (error instanceof HttpError) {
      const message = error.messageKey ? t(error.messageKey) : error.message;
      handleError(res, new Error(message), error.statusCode);
      return;
    }
    handleError(res, new Error(t('common:errors.internalError')));
  };
}
