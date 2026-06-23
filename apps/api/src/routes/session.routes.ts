import { Router } from "express";
import { DIContainer } from "../container/di.container";

const router = Router();

router.post("/start", (req, res) => {
  DIContainer.getInstance().getSessionController().start(req, res);
});

router.post("/:sessionId/interact", async (req, res) => {
  await DIContainer.getInstance().getSessionController().interact(req, res);
});

export default router;
