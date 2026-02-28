import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { youtubeAuthController, youtubeAuthCallbackController } from "../controllers/social-verification.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SocialVerification
 *   description: Social media platform verification operations
 */

/**
 * @swagger
 * /api/social-verification/youtube/auth:
 *   get:
 *     summary: Initiate YouTube authentication
 *     description: Redirects the user to Google OAuth consent screen. REQUIRES a valid JWT token.
 *     tags: [SocialVerification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/youtube/auth", authenticate, youtubeAuthController);

/**
 * @swagger
 * /api/social-verification/youtube/callback:
 *   get:
 *     summary: Handle YouTube authentication callback
 *     description: Processes the callback from Google OAuth, verifies the YouTube channel, and stores the verification data
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google OAuth
 *     responses:
 *       200:
 *         description: YouTube channel verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: YouTube account verified successfully
 *                 channelTitle:
 *                   type: string
 *                   example: My YouTube Channel
 *                 isVerified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: No YouTube channel found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No YouTube channel found
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/youtube/callback", youtubeAuthCallbackController);

export default router;
