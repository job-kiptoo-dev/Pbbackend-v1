import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateRegister,
  validateLogin,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateGoogleLogin,
  handleValidationErrors,
} from "../middleware/validation.middleware";
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  googleAuthLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *               - birthday
 *               - gender
 *               - phone
 *               - city
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum:
 *                   - Male
 *                   - Female
 *                   - Other
 *                 example: Male
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               city:
 *                 type: string
 *                 example: "New York"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female, Other]
 *                       example: Male
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     city:
 *                       type: string
 *                       example: "New York"
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Registration failed
 *                 message:
 *                   type: string
 *                   example: User with this email already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Registration failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during registration
 */
router.post(
  "/register",
  registerLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);

/**
 * @swagger
 * /api/auth/verify/{token}:
 *   get:
 *     summary: Verify user email
 *     description: Verifies a user's email address using the verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verification successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female, Other]
 *                       example: Male
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     city:
 *                       type: string
 *                       example: "New York"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *       400:
 *         description: Invalid verification token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Invalid or expired verification token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during verification
 */
router.get("/verify/:token", authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resends the verification email to the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification email sent successfully
 *       400:
 *         description: User not found or already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: User not found or Email is already verified
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Internal server error while sending verification email
 */
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  validateResendVerification,
  handleValidationErrors,
  authController.resendVerification
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female, Other]
 *                       example: Male
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     city:
 *                       type: string
 *                       example: "New York"
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication failed
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during login
 */
router.post(
  "/login",
  loginLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

/**
 * @swagger
 * /api/auth/login/google/auth-url:
 *   get:
 *     summary: Get Google authentication URL
 *     description: Returns a URL for Google authentication
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: URL for Google authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=openid%20profile%20email
 */
router.get("/login/google/auth-url", googleAuthLimiter, authController.getGoogleAuthUrl)

/**
 * @swagger
 * /api/auth/login/google:
 *   post:
 *     summary: Login with Google OAuth
 *     description: Authenticates a user using Google ID token and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@gmail.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: null
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female, Other]
 *                       example: null
 *                     phone:
 *                       type: string
 *                       example: null
 *                     city:
 *                       type: string
 *                       example: null
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *       400:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication failed
 *                 message:
 *                   type: string
 *                   example: Invalid Google token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during Google login
 */
router.post(
  "/login/google",
  googleAuthLimiter,
  validateGoogleLogin,
  handleValidationErrors,
  authController.loginWithGoogle
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset email to the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset instructions sent if email exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If your email is registered, you will receive password reset instructions.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Password reset failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during password reset request
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateForgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset user password
 *     description: Resets a user's password using the reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Password reset failed
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Password reset failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during password reset
 */
router.post(
  "/reset-password/:token",
  validateResetPassword,
  handleValidationErrors,
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/youtube/initiate:
 *   post:
 *     summary: Initiate YouTube channel verification
 *     description: Starts the YouTube verification process and returns a verification token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Verification initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: YouTube verification initiated
 *                 verificationToken:
 *                   type: string
 *                   example: f47ac10b-58cc-4372-a567
 *                 instructions:
 *                   type: string
 *                   example: Add this token to your YouTube channel description or create a video with this token in the title. Then call the verification endpoint to complete the process.
 *       400:
 *         description: Already verified or other error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Already verified
 *                 message:
 *                   type: string
 *                   example: Your YouTube channel is already verified
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *                 message:
 *                   type: string
 *                   example: You must be logged in to verify your YouTube channel
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during YouTube verification initiation
 */
// router.post("/youtube/initiate", authController.initiateYoutubeVerification);

/**
 * @swagger
 * /api/auth/youtube/verify:
 *   post:
 *     summary: Verify YouTube channel
 *     description: Completes the YouTube verification process by checking the channel for the token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - youtubeChannelId
 *               - verificationType
 *             properties:
 *               youtubeChannelId:
 *                 type: string
 *                 example: UC_x5XG1OV2P6uZZ5FSM9Ttw
 *               verificationType:
 *                 type: string
 *                 enum: [description, video]
 *                 example: description
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
 *                   example: YouTube channel verified successfully
 *                 youtubeChannelId:
 *                   type: string
 *                   example: UC_x5XG1OV2P6uZZ5FSM9Ttw
 *                 youtubeChannelName:
 *                   type: string
 *                   example: YouTube Channel UC_x5
 *       400:
 *         description: Verification failed or other error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Could not find the verification token in your YouTube channel. Please make sure you've added it correctly and try again.
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *                 message:
 *                   type: string
 *                   example: You must be logged in to verify your YouTube channel
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Verification failed
 *                 message:
 *                   type: string
 *                   example: Internal server error during YouTube verification
 */
// router.post("/youtube/verify", authController.verifyYoutubeChannel);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     description: Allows a logged-in user to change their password
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: currentPassword123
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: newPassword123
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error or password same as current
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post(
  "/change-password",
  authenticate,
  validateChangePassword,
  handleValidationErrors,
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/account-type:
 *   put:
 *     summary: Update user account type
 *     description: Updates the account type for an authenticated user (Individual, Business, Creator, or None)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountType
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [Individual, Business, Creator, None]
 *                 example: Creator
 *     responses:
 *       200:
 *         description: Account type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account type updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     accountType:
 *                       type: string
 *                       enum: [Individual, Business, Creator, None]
 *                       example: Creator
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T00:00:00.000Z
 *       400:
 *         description: Invalid account type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid account type
 *                 message:
 *                   type: string
 *                   example: "Account type must be one of: Individual, Business, Creator, None"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *                 message:
 *                   type: string
 *                   example: You must be logged in to update your account type
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Account type update failed
 *                 message:
 *                   type: string
 *                   example: Internal server error while updating account type
 */
router.put(
  "/account-type",
  authenticate,
  authController.updateAccountType
);

/**
 * @swagger
 * /api/auth/creator-profile:
 *   get:
 *     summary: Get creator profile
 *     description: Retrieves the authenticated user's creator profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Creator profile retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/creator-profile",
  authenticate,
  authController.getCreatorProfile
);

/**
 * @swagger
 * /api/auth/creator-profile/basic-info:
 *   put:
 *     summary: Update creator basic info
 *     description: Update creator name, about, and main field
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               creatorname:
 *                 type: string
 *               about:
 *                 type: string
 *               main:
 *                 type: string
 *     responses:
 *       200:
 *         description: Creator basic info updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/basic-info",
  authenticate,
  authController.updateCreatorBasicInfo
);

/**
 * @swagger
 * /api/auth/creator-profile/social-media:
 *   put:
 *     summary: Update creator social media
 *     description: Update social media handles and followers
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followers:
 *                 type: string
 *               instagram:
 *                 type: string
 *               tiktok:
 *                 type: string
 *               twitter:
 *                 type: string
 *               youtube:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               facebook:
 *                 type: string
 *               social:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social media updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/social-media",
  authenticate,
  authController.updateCreatorSocialMedia
);

/**
 * @swagger
 * /api/auth/creator-profile/experience:
 *   put:
 *     summary: Update creator experience
 *     description: Update experience, milestones, and collaborations
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               experience:
 *                 type: string
 *               milestones:
 *                 type: string
 *               collabs:
 *                 type: string
 *     responses:
 *       200:
 *         description: Experience updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/experience",
  authenticate,
  authController.updateCreatorExperience
);

/**
 * @swagger
 * /api/auth/creator-profile/categories-values:
 *   put:
 *     summary: Update creator categories and values
 *     description: Update category, subcategory, core values, topics
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *               corevalue:
 *                 type: string
 *               coreValues:
 *                 type: array
 *                 items:
 *                   type: string
 *               subCoreValues:
 *                 type: array
 *                 items:
 *                   type: string
 *               topics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Categories and values updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/categories-values",
  authenticate,
  authController.updateCreatorCategoriesValues
);

/**
 * @swagger
 * /api/auth/creator-profile/media:
 *   put:
 *     summary: Update creator media
 *     description: Update avatar and preview URLs/files
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *               preview:
 *                 type: string
 *     responses:
 *       200:
 *         description: Media updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/media",
  authenticate,
  authController.updateCreatorMedia
);

/**
 * @swagger
 * /api/auth/creator-profile/full:
 *   put:
 *     summary: Update entire creator profile
 *     description: Update all creator profile fields in one request
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Creator profile updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/creator-profile/full",
  authenticate,
  authController.updateCreatorProfileFull
);

export default router;

