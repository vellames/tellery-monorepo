import { Router } from 'express';
import healthRoutes from './health.routes';
import historyRoutes from './history.routes';
import sessionRoutes from './session.routes';
import userRoutes from './user/user.routes';

const router = Router();

router.use(healthRoutes);
router.use('/histories', historyRoutes);
router.use('/session', sessionRoutes);
router.use('/users', userRoutes);

export default router;
