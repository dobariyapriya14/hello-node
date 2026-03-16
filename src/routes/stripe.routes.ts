import express from "express";
import { createPaymentIntent, handleWebhook } from "../controllers/stripe.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/stripe/create-payment-intent:
 *   post:
 *     summary: Create a Stripe Payment Intent
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *               currency:
 *                 type: string
 *                 example: usd
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 */
router.post("/create-payment-intent", authMiddleware, createPaymentIntent);

export default router;
