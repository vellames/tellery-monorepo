import { NextFunction, Request, Response } from "express";
import {
  defaultLanguage,
  i18next,
  SupportedLanguage,
  supportedLanguages,
} from "../config/i18n.config";
import { TranslationFunction, TranslationOptions } from "../types/i18n.types";

declare module "express-serve-static-core" {
  interface Request {
    language: SupportedLanguage;
    t: TranslationFunction;
  }
}

export const i18nMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const acceptLanguage = req.headers["accept-language"];
  let detectedLanguage: SupportedLanguage = defaultLanguage;

  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim())
      .filter((lang) => supportedLanguages.includes(lang as SupportedLanguage));

    if (languages.length > 0) {
      detectedLanguage = languages[0] as SupportedLanguage;
    }
  }

  req.language = detectedLanguage;

  req.t = (key: string, options?: TranslationOptions) => {
    return i18next.t(key, { ...options, lng: detectedLanguage }) as string;
  };

  i18next.changeLanguage(detectedLanguage);

  next();
};
