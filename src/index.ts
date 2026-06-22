import express from "express";
import { z } from "zod";
import {
  HistoryRepository,
  HistorySessionRepository,
  UserRepository,
} from "./repositories";

const app = express();
const port = process.env.PORT ?? 3000;
const users = new UserRepository();
const histories = new HistoryRepository();
const sessions = new HistorySessionRepository();

const startSessionBodySchema = z.object({
  userId: z.string().min(1),
  historyId: z.string().min(1).optional(),
  historySlug: z.string().min(1).optional(),
});

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "AI History API",
    endpoints: {
      "GET /health": "Health check",
      "POST /session/start": "Start a mock in-memory history session",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/session/start", (req, res) => {
  const parsedBody = startSessionBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid request body",
      issues: parsedBody.error.issues,
    });
    return;
  }

  const user = users.findById(parsedBody.data.userId);
  if (!user) {
    res
      .status(404)
      .json({ error: `Unknown userId: ${parsedBody.data.userId}` });
    return;
  }

  const history =
    (parsedBody.data.historyId
      ? histories.findById(parsedBody.data.historyId)
      : undefined) ??
    (parsedBody.data.historySlug
      ? histories.findBySlug(parsedBody.data.historySlug)
      : undefined) ??
    histories.findDefault();

  if (!history) {
    res.status(404).json({ error: "No history available to start" });
    return;
  }

  const session = sessions.create({
    userId: user.id,
    history,
  });

  res.status(201).json({
    session,
    history: {
      id: history.id,
      slug: history.slug,
      title: history.title,
      subtitle: history.subtitle ?? null,
      opening: history.opening,
      objective: history.objective,
    },
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
