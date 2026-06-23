import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  CharacterAgentResult,
  detectIntent,
  DetectedIntent,
  ObjectAgentDiscoveredClue,
  runCharacterAgent,
  runObjectAgent,
} from "./engine";
import {
  CharacterSessionState,
  HistorySession,
  LocationSessionState,
  ObjectSessionState,
} from "./models";
import {
  HistoryRepository,
  HistorySessionRepository,
  UserRepository,
} from "./repositories";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

const users = new UserRepository();
const histories = new HistoryRepository();
const sessions = new HistorySessionRepository();

const startSessionBodySchema = z.object({
  userId: z.string().min(1),
  historyId: z.string().min(1).optional(),
  historySlug: z.string().min(1).optional(),
});

const interactBodySchema = z.object({
  stateId: z.string().min(1),
  interaction: z.string().min(1),
});

app.get("/", (_req, res) => {
  res.json({
    message: "AI History API",
    endpoints: {
      "GET /health": "Health check",
      "POST /session/start": "Start a mock in-memory history session",
      "POST /session/:sessionId/interact":
        "Interact with a character or object in a session",
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
    sessionStatus: session.status,
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

app.post("/session/:sessionId/interact", async (req, res) => {
  const session = sessions.findById(req.params.sessionId);
  if (!session) {
    res
      .status(404)
      .json({ error: `Unknown sessionId: ${req.params.sessionId}` });
    return;
  }

  const parsedBody = interactBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid request body",
      issues: parsedBody.error.issues,
    });
    return;
  }

  const id = parsedBody.data.stateId;
  const resolvedState = resolveSessionState(session, id);

  if (!resolvedState) {
    res.status(404).json({ error: `Unknown session state id: ${id}` });
    return;
  }

  const history = histories.findById(session.historyId);
  if (!history) {
    res.status(404).json({ error: `Unknown historyId: ${session.historyId}` });
    return;
  }

  let discoveredClueIds: string[] = [];

  if (resolvedState.type === "location" && !resolvedState.state.visited) {
    const location = history.locations.find(
      (historyLocation) => historyLocation.id === resolvedState.state.locationId
    );

    resolvedState.state.visited = true;
    resolvedState.state.visitedAt = new Date();
    session.progress.visitedLocationIds = addUnique(
      session.progress.visitedLocationIds,
      resolvedState.state.locationId
    );

    if (location) {
      discoveredClueIds = location.ambientClueIds.filter(
        (clueId) => !session.progress.discoveredClueIds.includes(clueId)
      );
      resolvedState.state.revealedAmbientClueIds = addUnique(
        resolvedState.state.revealedAmbientClueIds,
        ...location.ambientClueIds
      );
      session.progress.discoveredClueIds = addUnique(
        session.progress.discoveredClueIds,
        ...location.ambientClueIds
      );
    }
  }

  let detectedIntents: DetectedIntent[] = [];
  let characterAgentResult: CharacterAgentResult | null = null;
  let objectAgentDiscoveredClues: ObjectAgentDiscoveredClue[] = [];

  if (resolvedState.type !== "location") {
    try {
      detectedIntents = await detectIntent({
        message: parsedBody.data.interaction,
        intents: history.intentDefinitions,
        language: history.language,
      });

      console.log("intent_detector_result", {
        sessionId: session.id,
        stateId: id,
        interaction: parsedBody.data.interaction,
        detectedIntents,
      });

      if (resolvedState.type === "character") {
        const character = history.characters.find(
          (historyCharacter) =>
            historyCharacter.id === resolvedState.state.characterId
        );

        if (!character) {
          res.status(404).json({
            error: `Unknown characterId: ${resolvedState.state.characterId}`,
          });
          return;
        }

        const recentConversation = sessions.getRecentCharacterConversation({
          sessionId: session.id,
          characterStateId: resolvedState.state.id,
        });

        characterAgentResult = await runCharacterAgent({
          character,
          characterState: resolvedState.state,
          clues: history.clues,
          detectedIntents,
          discoveredClueIds: session.progress.discoveredClueIds,
          interaction: parsedBody.data.interaction,
          recentConversation,
          language: history.language,
        });

        const characterDiscoveredClueIds =
          characterAgentResult.discoveredClues.map((clue) => clue.clueId);

        resolvedState.state.conversationSummary =
          characterAgentResult.updatedConversationSummary;
        resolvedState.state.secretStates =
          characterAgentResult.updatedSecretStates;
        resolvedState.state.revealedClueIds = addUnique(
          resolvedState.state.revealedClueIds,
          ...characterDiscoveredClueIds
        );
        session.progress.talkedToCharacterIds = addUnique(
          session.progress.talkedToCharacterIds,
          resolvedState.state.characterId
        );
        session.progress.discoveredClueIds = addUnique(
          session.progress.discoveredClueIds,
          ...characterDiscoveredClueIds
        );
        discoveredClueIds = addUnique(
          discoveredClueIds,
          ...characterDiscoveredClueIds
        );

        sessions.appendCharacterConversationMessage({
          sessionId: session.id,
          characterStateId: resolvedState.state.id,
          message: {
            role: "user",
            content: parsedBody.data.interaction,
            createdAt: new Date(),
          },
        });
        sessions.appendCharacterConversationMessage({
          sessionId: session.id,
          characterStateId: resolvedState.state.id,
          message: {
            role: "character",
            content: characterAgentResult.reply,
            createdAt: new Date(),
          },
        });

        console.log("character_agent_result", {
          sessionId: session.id,
          stateId: id,
          characterId: character.id,
          characterAgentResult,
        });
      } else if (resolvedState.type === "object") {
        const object = history.objects.find(
          (historyObject) => historyObject.id === resolvedState.state.objectId
        );

        if (!object) {
          res.status(404).json({
            error: `Unknown objectId: ${resolvedState.state.objectId}`,
          });
          return;
        }

        objectAgentDiscoveredClues = await runObjectAgent({
          object,
          clues: history.clues,
          detectedIntents,
          discoveredClueIds: session.progress.discoveredClueIds,
          language: history.language,
        });

        const objectDiscoveredClueIds = objectAgentDiscoveredClues.map(
          (clue) => clue.clueId
        );

        resolvedState.state.inspected = true;
        resolvedState.state.inspectedAt = new Date();
        resolvedState.state.revealedClueIds = addUnique(
          resolvedState.state.revealedClueIds,
          ...objectDiscoveredClueIds
        );
        session.progress.inspectedObjectIds = addUnique(
          session.progress.inspectedObjectIds,
          resolvedState.state.objectId
        );
        session.progress.discoveredClueIds = addUnique(
          session.progress.discoveredClueIds,
          ...objectDiscoveredClueIds
        );
        discoveredClueIds = addUnique(
          discoveredClueIds,
          ...objectDiscoveredClueIds
        );

        console.log("object_agent_result", {
          sessionId: session.id,
          stateId: id,
          objectId: object.id,
          objectAgentDiscoveredClues,
        });
      }
    } catch (error) {
      res.status(502).json({
        error:
          error instanceof Error ? error.message : "Intent detection failed",
      });
      return;
    }
  }

  const discoveredClues = history.clues.filter((clue) =>
    discoveredClueIds.includes(clue.id)
  );

  res.json({
    id,
    reply: characterAgentResult?.reply ?? null,
    detectedIntents,
    characterAgentResult,
    objectAgentDiscoveredClues,
    discoveredClues,
    sessionStatus: session.status,
    session,
  });
});

function addUnique<T>(items: T[], ...newItems: T[]): T[] {
  return Array.from(new Set([...items, ...newItems]));
}

type ResolvedSessionState =
  | { type: "character"; state: CharacterSessionState }
  | { type: "object"; state: ObjectSessionState }
  | { type: "location"; state: LocationSessionState };

function resolveSessionState(
  session: HistorySession,
  stateId: string
): ResolvedSessionState | undefined {
  const characterState = session.characterStates.find(
    (state) => state.id === stateId
  );
  if (characterState) return { type: "character", state: characterState };

  const objectState = session.objectStates.find(
    (state) => state.id === stateId
  );
  if (objectState) return { type: "object", state: objectState };

  const locationState = session.locationStates.find(
    (state) => state.id === stateId
  );
  if (locationState) return { type: "location", state: locationState };

  return undefined;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
