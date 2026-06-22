import express from "express";
import { buildMessagesWithAgent, getAgent, listAgents } from "./agents";
import { DEFAULT_MODEL } from "./config";
import { chat, ChatMessage, listModels } from "./openrouter";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "AI History API",
    endpoints: {
      "GET /agents": "List available agents",
      "GET /models": "List available OpenRouter models",
      "POST /chat": "Send a message to an AI model",
    },
  });
});

app.get("/agents", (_req, res) => {
  res.json({ agents: listAgents() });
});

app.get("/agents/:agentId", (req, res) => {
  const agent = getAgent(req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: `Unknown agentId: ${req.params.agentId}` });
    return;
  }

  res.json({
    id: agent.id,
    name: agent.name,
    systemPrompt: agent.systemPrompt,
  });
});

app.get("/models", async (_req, res) => {
  try {
    const models = await listModels();
    res.json({ models });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : "Failed to fetch models",
    });
  }
});

app.post("/chat", async (req, res) => {
  const { message, model = DEFAULT_MODEL, messages, agentId } = req.body as {
    message?: string;
    model?: string;
    messages?: ChatMessage[];
    agentId?: string;
  };

  let chatMessages: ChatMessage[];

  if (messages?.length) {
    chatMessages = messages;
  } else if (typeof message === "string" && message.trim()) {
    chatMessages = [{ role: "user", content: message.trim() }];
  } else {
    res.status(400).json({
      error: 'Provide either "message" (string) or "messages" (array)',
    });
    return;
  }

  if (agentId) {
    if (!getAgent(agentId)) {
      res.status(400).json({
        error: `Unknown agentId: ${agentId}`,
        availableAgents: listAgents(),
      });
      return;
    }

    try {
      chatMessages = buildMessagesWithAgent(agentId, chatMessages);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid agentId",
      });
      return;
    }
  }

  try {
    const result = await chat(chatMessages, model);
    res.json({ ...result, agentId: agentId ?? null });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : "Chat request failed",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
