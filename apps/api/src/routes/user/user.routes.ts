import { Router } from "express";
import { DIContainer } from "../../container/di.container";

const router = Router();

/**
 * @openapi
 * /users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Invalid request body
 *       409:
 *         description: Email already in use
 */
router.post("/register", async (req, res) => {
  await DIContainer.getInstance().getUserController().register(req, res);
});

export default router;
