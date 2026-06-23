import { Request, Response } from "express";
import { HistorySessionService } from "../services/session/history-session.service";
import { SessionInteractionService } from "../services/session/session-interaction.service";
import {
  interactBodySchema,
  startSessionBodySchema,
} from "../types/http/session.validation";
import { HttpError } from "../utils/http-error";

export class SessionController {
  constructor(
    private readonly historySessionService: HistorySessionService,
    private readonly sessionInteractionService: SessionInteractionService
  ) {}

  start = (req: Request, res: Response): void => {
    const parsedBody = startSessionBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request body",
        issues: parsedBody.error.issues,
      });
      return;
    }

    try {
      const response = this.historySessionService.startSession(parsedBody.data);
      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  interact = async (req: Request, res: Response): Promise<void> => {
    const parsedBody = interactBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        error: "Invalid request body",
        issues: parsedBody.error.issues,
      });
      return;
    }

    try {
      const sessionId = String(req.params.sessionId);
      const response = await this.sessionInteractionService.interact(
        sessionId,
        parsedBody.data
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
