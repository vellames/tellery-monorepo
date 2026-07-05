import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StoryCatalogService } from '../services/story/story-catalog.service';
import { listStoriesQuerySchema } from '../types/http/story.validation';
import { HttpError } from '../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../utils/response.utils';
import { TranslationFunction } from '../types/i18n.types';

export class StoryController {
  constructor(private readonly storyCatalogService: StoryCatalogService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsedQuery = listStoriesQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestQuery'),
        parsedQuery.error.issues
      );
      return;
    }

    try {
      const { isFeatured, isFree, page, limit } = parsedQuery.data;
      const stories = await this.storyCatalogService.listAvailable(
        isFeatured,
        { page, limit },
        isFree
      );
      sendSuccess(res, stories);
    } catch (error) {
      handleError(
        res,
        error,
        StatusCodes.INTERNAL_SERVER_ERROR,
        t('common:errors.internalError')
      );
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const story = await this.storyCatalogService.getById(
        String(req.params.storyId)
      );
      sendSuccess(res, story);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, error, error.statusCode, message);
        return;
      }
      handleError(
        res,
        error,
        StatusCodes.INTERNAL_SERVER_ERROR,
        t('common:errors.internalError')
      );
    }
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const story = await this.storyCatalogService.getBySlug(
        String(req.params.slug)
      );
      sendSuccess(res, story);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, error, error.statusCode, message);
        return;
      }
      handleError(
        res,
        error,
        StatusCodes.INTERNAL_SERVER_ERROR,
        t('common:errors.internalError')
      );
    }
  };
}
