import express from "express";
import { getWelcome } from "../controllers/user.controller";
const router = express.Router();

/**
 * @swagger
 * /api/language:
 *   get:
 *     summary: Get welcome message
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, hi, gu]
 *         description: Language code (en, hi, gu)
 *     responses:
 *       200:

 *         description: Welcome message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to our API!
 */
router.get("/language", getWelcome);

export default router;