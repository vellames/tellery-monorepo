import { Router } from "express";
import healthRoutes from "./health.routes";
import sessionRoutes from "./session.routes";

const router = Router();

router.use(healthRoutes);
router.use("/session", sessionRoutes);

export default router;
