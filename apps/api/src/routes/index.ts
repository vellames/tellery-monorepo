import { Router } from 'express';
import healthRoutes from './health.routes';
import sessionRoutes from './session.routes';
import userRoutes from './user/user.routes';

const router = Router();

router.use(healthRoutes);
router.use('/session', sessionRoutes);
router.use('/users', userRoutes);

export default router;
