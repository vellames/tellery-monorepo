import { Router } from 'express';
import healthRoutes from './health.routes';
import storyRoutes from './story.routes';
import leadRoutes from './lead/leads.routes';
import sessionRoutes from './session.routes';
import subscriptionRoutes from './subscription/subscription.routes';
import revenueCatWebhookRoutes from './subscription/revenuecat-webhook.routes';
import userRoutes from './user/user.routes';
import meRoutes from './user/me.routes';

const router = Router();

router.use(healthRoutes);
router.use('/stories', storyRoutes);
router.use('/leads', leadRoutes);
router.use('/session', sessionRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/subscriptions', revenueCatWebhookRoutes);
router.use('/users', userRoutes);
router.use('/me', meRoutes);

export default router;
