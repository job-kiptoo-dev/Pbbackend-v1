import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
    youtubeAuthController,
    youtubeAuthCallbackController,
    facebookAuthController,
    facebookAuthCallbackController,
    instagramAuthController,
    instagramAuthCallbackController,
    tiktokAuthController,
    tiktokAuthCallbackController,
    xAuthController,
    xAuthCallbackController,
    linkedinAuthController,
    linkedinAuthCallbackController
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

/**
 * @swagger
 * /api/social-verification/tiktok/auth:
 *   get:
 *     summary: Initiate TikTok authentication
 *     description: Redirects to TikTok Login. Best called via browser address bar.
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
 *         description: Redirects to TikTok Login
 */
router.get("/tiktok/auth", authenticate, tiktokAuthController);

/**
 * @swagger
 * /api/social-verification/tiktok/callback:
 *   get:
 *     summary: Handle TikTok authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: TikTok account verified successfully
 */
router.get("/tiktok/callback", tiktokAuthCallbackController);

/**
 * @swagger
 * /api/social-verification/x/auth:
 *   get:
 *     summary: Initiate X (Twitter) authentication
 *     description: Redirects to X Login. Best called via browser address bar.
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
 *         description: Redirects to X Login
 */
router.get("/x/auth", authenticate, xAuthController);

/**
 * @swagger
 * /api/social-verification/x/callback:
 *   get:
 *     summary: Handle X (Twitter) authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: X account verified successfully
 */
router.get("/x/callback", xAuthCallbackController);

/**
 * @swagger
 * /api/social-verification/linkedin/auth:
 *   get:
 *     summary: Initiate LinkedIn authentication
 *     description: Redirects to LinkedIn Login. Best called via browser address bar.
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
 *         description: Redirects to LinkedIn Login
 */
router.get("/linkedin/auth", authenticate, linkedinAuthController);

/**
 * @swagger
 * /api/social-verification/linkedin/callback:
 *   get:
 *     summary: Handle LinkedIn authentication callback
 *     tags: [SocialVerification]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: LinkedIn account verified successfully
 */
router.get("/linkedin/callback", linkedinAuthCallbackController);

export default router;
