import { Request, Response } from 'express';

export class HealthController {
  index(_req: Request, res: Response): void {
    res.json({
      message: 'AI History API',
      endpoints: {
        'GET /health': 'Health check',
        'POST /session/start': 'Start a mock in-memory history session',
        'POST /session/:sessionId/interact':
          'Interact with a character or object in a session',
      },
    });
  }

  health(_req: Request, res: Response): void {
    res.json({ status: 'ok' });
  }
}
