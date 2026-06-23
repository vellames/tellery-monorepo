import { Router } from "express";
import { DIContainer } from "../container/di.container";

const router = Router();

router.get("/", (req, res) => {
  DIContainer.getInstance().getHealthController().index(req, res);
});

router.get("/health", (req, res) => {
  DIContainer.getInstance().getHealthController().health(req, res);
});

export default router;
