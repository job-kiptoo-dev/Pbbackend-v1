/**
 * Escrow Routes
 *
 * All routes for the escrow system, seller payout accounts,
 * admin escrow management, and notifications.
 *
 * Route groups:
 *   /api/escrow/*          - Escrow lifecycle & queries
 *   /api/seller/*          - Seller payout account management
 *   /api/admin/escrow/*    - Admin-only escrow management
 *   /api/notifications/*   - User notification management
 *
 * All routes require JWT authentication via the `authenticate` middleware.
 * Admin routes additionally require the `requireAdmin` middleware.
 */

import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import escrowController from "../controllers/escrow.controller";

const router = Router();

// ============================================================
// ESCROW ROUTES
// ============================================================

/**
 * @swagger
 * /api/escrow:
 *   get:
 *     summary: List escrows for the authenticated user
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending,funded,in_progress,delivered,released,disputed,refunded,cancelled] }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [buyer, seller] }
 *     responses:
 *       200:
 *         description: Paginated list of escrow transactions
 */
router.get("/api/escrow", authenticate, escrowController.listEscrows);

/**
 * @swagger
 * /api/escrow/stats:
 *   get:
 *     summary: Get escrow dashboard statistics
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics for the authenticated user
 */
router.get("/api/escrow/stats", authenticate, escrowController.getDashboardStats);

/**
 * @swagger
 * /api/escrow/{id}:
 *   get:
 *     summary: Get a single escrow by ID
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Escrow details
 *       404:
 *         description: Escrow not found
 */
router.get("/api/escrow/:id", authenticate, escrowController.getEscrowById);

/**
 * @swagger
 * /api/escrow/{id}/events:
 *   get:
 *     summary: Get audit log for an escrow
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of escrow events (audit trail)
 */
router.get("/api/escrow/:id/events", authenticate, escrowController.getEscrowEvents);

/**
 * @swagger
 * /api/escrow/from-job-proposal/{proposalId}:
 *   post:
 *     summary: Create escrow from a job proposal
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Escrow created with Paystack payment URL
 */
router.post(
    "/api/escrow/from-job-proposal/:proposalId",
    authenticate,
    escrowController.createFromJobProposal
);

/**
 * @swagger
 * /api/escrow/from-campaign/{campaignId}:
 *   post:
 *     summary: Create escrow from a campaign
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sellerId]
 *             properties:
 *               sellerId: { type: integer }
 *     responses:
 *       201:
 *         description: Escrow created with Paystack payment URL
 */
router.post(
    "/api/escrow/from-campaign/:campaignId",
    authenticate,
    escrowController.createFromCampaign
);

/**
 * @swagger
 * /api/escrow/from-service-request/{srId}:
 *   post:
 *     summary: Create escrow from a service request
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: srId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sellerId]
 *             properties:
 *               sellerId: { type: integer }
 *     responses:
 *       201:
 *         description: Escrow created with Paystack payment URL
 */
router.post(
    "/api/escrow/from-service-request/:srId",
    authenticate,
    escrowController.createFromServiceRequest
);

/**
 * @swagger
 * /api/escrow/{id}/verify-payment:
 *   post:
 *     summary: Verify buyer payment and fund escrow (Phase 1 manual flow)
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment verified and escrow funded
 */
router.post("/api/escrow/:id/verify-payment", authenticate, escrowController.verifyPayment);

/**
 * @swagger
 * /api/escrow/{id}/start:
 *   post:
 *     summary: Seller marks work as started
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Work started
 */
router.post("/api/escrow/:id/start", authenticate, escrowController.startWork);

/**
 * @swagger
 * /api/escrow/{id}/deliver:
 *   post:
 *     summary: Seller marks work as delivered
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryNote: { type: string }
 *     responses:
 *       200:
 *         description: Delivery confirmed
 */
router.post("/api/escrow/:id/deliver", authenticate, escrowController.markDelivered);

/**
 * @swagger
 * /api/escrow/{id}/release:
 *   post:
 *     summary: Buyer releases funds to seller
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Funds released to seller
 */
router.post("/api/escrow/:id/release", authenticate, escrowController.releaseFunds);

/**
 * @swagger
 * /api/escrow/{id}/dispute:
 *   post:
 *     summary: Raise a dispute on an escrow
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 10 }
 *     responses:
 *       200:
 *         description: Dispute raised
 */
router.post("/api/escrow/:id/dispute", authenticate, escrowController.raiseDispute);

/**
 * @swagger
 * /api/escrow/{id}/refund:
 *   post:
 *     summary: Buyer requests a refund
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Refund initiated
 */
router.post("/api/escrow/:id/refund", authenticate, escrowController.refundBuyer);

/**
 * @swagger
 * /api/escrow/{id}/cancel:
 *   post:
 *     summary: Cancel a pending escrow
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Escrow cancelled
 */
router.post("/api/escrow/:id/cancel", authenticate, escrowController.cancelEscrow);

// -- Milestone endpoints --

/**
 * @swagger
 * /api/escrow/{id}/milestones/{mid}/deliver:
 *   post:
 *     summary: Seller delivers a milestone
 *     tags: [Escrow Milestones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: mid
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Milestone delivered
 */
router.post("/api/escrow/:id/milestones/:mid/deliver", authenticate, escrowController.deliverMilestone);

/**
 * @swagger
 * /api/escrow/{id}/milestones/{mid}/release:
 *   post:
 *     summary: Buyer releases milestone funds
 *     tags: [Escrow Milestones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: mid
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Milestone funds released
 */
router.post("/api/escrow/:id/milestones/:mid/release", authenticate, escrowController.releaseMilestone);

// ============================================================
// SELLER PAYOUT ROUTES
// ============================================================

/**
 * @swagger
 * /api/seller/payout-account:
 *   post:
 *     summary: Set up or update seller payout account
 *     tags: [Seller Payout]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payoutMethod, accountName]
 *             properties:
 *               payoutMethod: { type: string, enum: [mpesa, bank] }
 *               accountName: { type: string }
 *               mpesaNumber: { type: string, description: "Required for M-PESA" }
 *               bankAccountNumber: { type: string, description: "Required for bank" }
 *               bankCode: { type: string, description: "Required for bank" }
 *     responses:
 *       201:
 *         description: Payout account created
 *   get:
 *     summary: Get seller's current payout account
 *     tags: [Seller Payout]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payout account details
 *   delete:
 *     summary: Remove seller payout account
 *     tags: [Seller Payout]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payout account removed
 */
router.post("/api/seller/payout-account", authenticate, escrowController.setupPayoutAccount);
router.get("/api/seller/payout-account", authenticate, escrowController.getPayoutAccount);
router.delete("/api/seller/payout-account", authenticate, escrowController.removePayoutAccount);

/**
 * @swagger
 * /api/seller/banks:
 *   get:
 *     summary: List available Kenyan banks from Paystack
 *     tags: [Seller Payout]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of banks
 */
router.get("/api/seller/banks", authenticate, escrowController.listBanks);

/**
 * @swagger
 * /api/seller/verify-account:
 *   post:
 *     summary: Verify a bank account name
 *     tags: [Seller Payout]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, bankCode]
 *             properties:
 *               accountNumber: { type: string }
 *               bankCode: { type: string }
 *     responses:
 *       200:
 *         description: Resolved account name
 */
router.post("/api/seller/verify-account", authenticate, escrowController.verifyAccount);

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/api/notifications", authenticate, escrowController.listNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/api/notifications/:id/read", authenticate, escrowController.markNotificationRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post("/api/notifications/read-all", authenticate, escrowController.markAllNotificationsRead);

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * @swagger
 * /api/admin/escrow:
 *   get:
 *     summary: List all escrows (admin only)
 *     tags: [Admin Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: All escrow transactions
 */
router.get("/api/admin/escrow", authenticate, requireAdmin, escrowController.adminListEscrows);

/**
 * @swagger
 * /api/admin/escrow/stats:
 *   get:
 *     summary: Platform-wide escrow statistics (admin only)
 *     tags: [Admin Escrow]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform financial statistics
 */
router.get("/api/admin/escrow/stats", authenticate, requireAdmin, escrowController.adminGetStats);

/**
 * @swagger
 * /api/admin/escrow/{id}/resolve:
 *   post:
 *     summary: Resolve a dispute (admin only)
 *     tags: [Admin Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution]
 *             properties:
 *               resolution: { type: string, enum: [release_to_seller, refund_buyer, partial_split] }
 *               notes: { type: string }
 *               splitPercent: { type: integer, minimum: 0, maximum: 100 }
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.post("/api/admin/escrow/:id/resolve", authenticate, requireAdmin, escrowController.adminResolveDispute);

export default router;
