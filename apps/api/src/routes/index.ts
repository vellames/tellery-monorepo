import { Router } from 'express';
import healthRoutes from './health.routes';
import historyRoutes from './history.routes';
import sessionRoutes from './session.routes';
import subscriptionRoutes from './subscription/subscription.routes';
import userRoutes from './user/user.routes';
import meRoutes from './user/me.routes';

const router = Router();

router.use(healthRoutes);
router.use('/histories', historyRoutes);
router.use('/session', sessionRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/users', userRoutes);
router.use('/me', meRoutes);

export default router;
