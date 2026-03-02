import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
    youtubeAuthController,
    youtubeAuthCallbackController,
    facebookAuthController,
    facebookAuthCallbackController,
    instagramAuthController,
    instagramAuthCallbackController
} from "../controllers/social-verification.controller";

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
 *     description: Redirects to Google OAuth. Best called via browser address bar.
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Your JWT token for authentication
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen
 *       500:
 *         description: Internal server error
 */
router.get("/youtube/auth", authenticate, youtubeAuthController);

/**
 * @swagger
 * /api/social-verification/youtube/callback:
 *   get:
 *     summary: Handle YouTube authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: YouTube channel verified successfully
 */
router.get("/youtube/callback", youtubeAuthCallbackController);

/**
 * @swagger
 * /api/social-verification/facebook/auth:
 *   get:
 *     summary: Initiate Facebook authentication
 *     description: Redirects to Facebook Login. Best called via browser address bar.
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Your JWT token for authentication
 *     responses:
 *       302:
 *         description: Redirects to Facebook Login
 */
router.get("/facebook/auth", authenticate, facebookAuthController);

/**
 * @swagger
 * /api/social-verification/facebook/callback:
 *   get:
 *     summary: Handle Facebook authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Facebook account verified successfully
 */
router.get("/facebook/callback", facebookAuthCallbackController);

/**
 * @swagger
 * /api/social-verification/instagram/auth:
 *   get:
 *     summary: Initiate Instagram authentication
 *     description: Redirects to Facebook Login for IG access. Best called via browser address bar.
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Your JWT token for authentication
 *     responses:
 *       302:
 *         description: Redirects to Facebook Login
 */
router.get("/instagram/auth", authenticate, instagramAuthController);

/**
 * @swagger
 * /api/social-verification/instagram/callback:
 *   get:
 *     summary: Handle Instagram authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instagram account verified successfully
 */
router.get("/instagram/callback", instagramAuthCallbackController);

export default router;
