/**
 * Escrow Controller
 *
 * Request handlers for all escrow-related endpoints.
 * This controller delegates business logic to the EscrowService
 * and handles HTTP concerns (request parsing, response formatting,
 * error mapping to HTTP status codes).
 *
 * Error handling convention:
 *   - EscrowNotFoundError    -> 404
 *   - EscrowValidationError  -> 400
 *   - EscrowAuthorizationError -> 403
 *   - EscrowStateError       -> 409 (Conflict)
 *   - PaystackError          -> 502 (Bad Gateway)
 *   - Unknown errors         -> 500
 */

import { Request, Response } from "express";
import escrowService, {
    EscrowNotFoundError,
    EscrowValidationError,
    EscrowAuthorizationError,
    EscrowStateError,
} from "../services/escrow.service";
import paystackService, { PaystackError } from "../services/paystack.service";
import notificationService from "../services/notification.service";
import { EscrowStatus, DisputeResolution } from "../db/entity/EscrowTransaction.entity";

class EscrowController {

    // ----------------------------------------------------------
    // Escrow creation endpoints
    // ----------------------------------------------------------

    /**
     * POST /api/escrow/from-job-proposal/:proposalId
     * Create an escrow from an accepted job proposal.
     */
    createFromJobProposal = async (req: Request, res: Response): Promise<Response> => {
        try {
            const proposalId = parseInt(req.params.proposalId, 10);
            if (isNaN(proposalId)) {
                return res.status(400).json({ success: false, error: "Invalid proposal ID" });
            }

            const result = await escrowService.createFromJobProposal(proposalId, req.userId!);

            return res.status(201).json({
                success: true,
                data: {
                    escrow: this.formatEscrow(result.escrow),
                    payment: {
                        authorization_url: result.paymentUrl,
                        reference: result.reference,
                    },
                },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/from-campaign/:campaignId
     * Create an escrow from a campaign.
     * Body: { sellerId: number }
     */
    createFromCampaign = async (req: Request, res: Response): Promise<Response> => {
        try {
            const campaignId = parseInt(req.params.campaignId, 10);
            const { sellerId } = req.body;

            if (isNaN(campaignId)) {
                return res.status(400).json({ success: false, error: "Invalid campaign ID" });
            }
            if (!sellerId) {
                return res.status(400).json({ success: false, error: "sellerId is required" });
            }

            const result = await escrowService.createFromCampaign(
                campaignId,
                parseInt(sellerId, 10),
                req.userId!
            );

            return res.status(201).json({
                success: true,
                data: {
                    escrow: this.formatEscrow(result.escrow),
                    payment: {
                        authorization_url: result.paymentUrl,
                        reference: result.reference,
                    },
                },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/from-service-request/:srId
     * Create an escrow from a service request.
     * Body: { sellerId: number }
     */
    createFromServiceRequest = async (req: Request, res: Response): Promise<Response> => {
        try {
            const srId = parseInt(req.params.srId, 10);
            const { sellerId } = req.body;

            if (isNaN(srId)) {
                return res.status(400).json({ success: false, error: "Invalid service request ID" });
            }
            if (!sellerId) {
                return res.status(400).json({ success: false, error: "sellerId is required" });
            }

            const result = await escrowService.createFromServiceRequest(
                srId,
                parseInt(sellerId, 10),
                req.userId!
            );

            return res.status(201).json({
                success: true,
                data: {
                    escrow: this.formatEscrow(result.escrow),
                    payment: {
                        authorization_url: result.paymentUrl,
                        reference: result.reference,
                    },
                },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Payment
    // ----------------------------------------------------------

    /**
     * POST /api/escrow/:id/verify-payment
     * Buyer verifies their Paystack payment (Phase 1 manual flow).
     */
    verifyPayment = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const escrow = await escrowService.verifyAndMarkFunded(escrowId, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Payment verified. Escrow is now funded.",
                data: { escrow: this.formatEscrow(escrow) },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/escrow/:id/payment-callback
     * Handle browser redirect from Paystack after payment.
     * Redirects buyer to frontend success/failure page.
     */
    paymentCallback = async (req: Request, res: Response): Promise<void> => {
        const escrowId = req.params.id;
        const reference = req.query.reference as string;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        if (!reference) {
            return res.redirect(`${frontendUrl}/payment/failed?reason=missing_reference`);
        }

        try {
            // 1. Verify payment with Paystack
            const tx = await paystackService.verifyPayment(reference);

            if (tx.status !== "success") {
                return res.redirect(`${frontendUrl}/escrow/${escrowId}/payment-failed?reason=${tx.status}`);
            }

            // 2. Mark as funded (idempotent)
            // We need to find the escrow first to get the buyerId for auth check mock
            // In a callback, we don't have a session usually, so we trust the reference match
            // The service method expects a userId for "actor" logging.
            // We can use the buyerId from the escrow transaction itself.
            const { EscrowTransaction } = require("../db/entity/EscrowTransaction.entity");
            const escrow = await EscrowTransaction.findOne({ where: { paystackPaymentRef: reference } });

            if (!escrow) {
                return res.redirect(`${frontendUrl}/payment/failed?reason=not_found`);
            }

            // If already funded, just redirect
            if (escrow.status === EscrowStatus.PENDING) {
                await escrowService.verifyAndMarkFunded(escrow.id, escrow.buyerId);
            }

            // 3. Redirect to success page
            return res.redirect(`${frontendUrl}/escrow/${escrowId}/payment-success`);

        } catch (error) {
            console.error("[PaymentCallback] Error:", error);
            return res.redirect(`${frontendUrl}/payment/failed?reason=server_error`);
        }
    };

    // ----------------------------------------------------------
    // Lifecycle
    // ----------------------------------------------------------

    /**
     * POST /api/escrow/:id/start
     * Seller marks that work has started.
     */
    startWork = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            await escrowService.startWork(escrowId, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Work started on escrow.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/deliver
     * Seller marks work as delivered.
     * Body: { deliveryNote?: string }
     */
    markDelivered = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            await escrowService.markDelivered(escrowId, req.userId!, req.body.deliveryNote);

            return res.status(200).json({
                success: true,
                message: "Work marked as delivered. Buyer has been notified.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/release
     * Buyer releases full payment to seller.
     */
    releaseFunds = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const result = await escrowService.releaseFunds(escrowId, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Funds released successfully.",
                data: { transfer: result },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/dispute
     * Buyer or seller raises a dispute.
     * Body: { reason: string }
     */
    raiseDispute = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({ success: false, error: "Dispute reason is required" });
            }

            await escrowService.raiseDispute(escrowId, req.userId!, reason);

            return res.status(200).json({
                success: true,
                message: "Dispute raised successfully.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/refund
     * Buyer requests a refund (before delivery).
     */
    refundBuyer = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            await escrowService.refundBuyer(escrowId, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Refund initiated successfully.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/cancel
     * Cancel an escrow (before funding only).
     * Body: { reason: string }
     */
    cancelEscrow = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({ success: false, error: "Cancellation reason is required" });
            }

            await escrowService.cancelEscrow(escrowId, req.userId!, reason);

            return res.status(200).json({
                success: true,
                message: "Escrow cancelled successfully.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Queries
    // ----------------------------------------------------------

    /**
     * GET /api/escrow
     * List escrows for the authenticated user.
     */
    listEscrows = async (req: Request, res: Response): Promise<Response> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const status = req.query.status as EscrowStatus | undefined;
            const role = req.query.role as "buyer" | "seller" | undefined;

            const result = await escrowService.listEscrows({
                userId: req.userId!,
                status,
                role,
                page,
                limit,
            });

            return res.status(200).json({
                success: true,
                data: {
                    escrows: result.escrows.map((e) => this.formatEscrow(e)),
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/escrow/stats
     * Dashboard stats for the authenticated user.
     */
    getDashboardStats = async (req: Request, res: Response): Promise<Response> => {
        try {
            const stats = await escrowService.getDashboardStats(req.userId!);
            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/escrow/:id
     * Get a single escrow by ID.
     */
    getEscrowById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const escrow = await escrowService.getEscrowById(escrowId, req.userId!);

            return res.status(200).json({
                success: true,
                data: { escrow: this.formatEscrow(escrow) },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/escrow/:id/events
     * Get the full audit log for an escrow.
     */
    getEscrowEvents = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            // Authorization check via getEscrowById
            await escrowService.getEscrowById(escrowId, req.userId!);
            const events = await escrowService.getEscrowEvents(escrowId);

            return res.status(200).json({ success: true, data: { events } });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Milestone endpoints
    // ----------------------------------------------------------

    /**
     * POST /api/escrow/:id/milestones/:mid/deliver
     */
    deliverMilestone = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            const milestoneId = parseInt(req.params.mid, 10);

            if (isNaN(escrowId) || isNaN(milestoneId)) {
                return res.status(400).json({ success: false, error: "Invalid ID" });
            }

            await escrowService.deliverMilestone(
                escrowId, milestoneId, req.userId!, req.body.deliveryNote
            );

            return res.status(200).json({
                success: true,
                message: "Milestone delivered.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/escrow/:id/milestones/:mid/release
     */
    releaseMilestone = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            const milestoneId = parseInt(req.params.mid, 10);

            if (isNaN(escrowId) || isNaN(milestoneId)) {
                return res.status(400).json({ success: false, error: "Invalid ID" });
            }

            const result = await escrowService.releaseMilestone(
                escrowId, milestoneId, req.userId!
            );

            return res.status(200).json({
                success: true,
                message: "Milestone funds released.",
                data: { transfer: result },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Seller payout account
    // ----------------------------------------------------------

    /**
     * POST /api/seller/payout-account
     * Body: { payoutMethod, mpesaNumber?, bankAccountNumber?, bankCode?, accountName }
     */
    setupPayoutAccount = async (req: Request, res: Response): Promise<Response> => {
        try {
            const account = await escrowService.setupPayoutAccount(req.userId!, req.body);
            return res.status(201).json({ success: true, data: { account } });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/seller/payout-account
     */
    getPayoutAccount = async (req: Request, res: Response): Promise<Response> => {
        try {
            const account = await escrowService.getPayoutAccount(req.userId!);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    error: "No active payout account found",
                });
            }
            return res.status(200).json({ success: true, data: { account } });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * DELETE /api/seller/payout-account
     */
    removePayoutAccount = async (req: Request, res: Response): Promise<Response> => {
        try {
            const removed = await escrowService.removePayoutAccount(req.userId!);
            if (!removed) {
                return res.status(404).json({
                    success: false,
                    error: "No active payout account to remove",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Payout account removed.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/seller/banks
     * List Kenyan banks from Paystack.
     */
    listBanks = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const banks = await paystackService.listKenyaBanks();
            return res.status(200).json({ success: true, data: { banks } });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/seller/verify-account
     * Verify a bank account name.
     * Body: { accountNumber, bankCode }
     */
    verifyAccount = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { accountNumber, bankCode } = req.body;
            if (!accountNumber || !bankCode) {
                return res.status(400).json({
                    success: false,
                    error: "accountNumber and bankCode are required",
                });
            }

            const result = await paystackService.resolveAccountNumber({
                accountNumber,
                bankCode,
            });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Notification endpoints
    // ----------------------------------------------------------

    /**
     * GET /api/notifications
     */
    listNotifications = async (req: Request, res: Response): Promise<Response> => {
        try {
            const unreadOnly = req.query.unreadOnly === "true";
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const offset = parseInt(req.query.offset as string, 10) || 0;

            const result = await notificationService.getByUserId(req.userId!, {
                unreadOnly,
                limit,
                offset,
            });

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * PATCH /api/notifications/:id/read
     */
    markNotificationRead = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, error: "Invalid ID" });
            }

            const success = await notificationService.markAsRead(id, req.userId!);
            if (!success) {
                return res.status(404).json({ success: false, error: "Notification not found" });
            }

            return res.status(200).json({ success: true, message: "Notification marked as read." });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/notifications/read-all
     */
    markAllNotificationsRead = async (req: Request, res: Response): Promise<Response> => {
        try {
            const count = await notificationService.markAllAsRead(req.userId!);
            return res.status(200).json({
                success: true,
                message: `${count} notifications marked as read.`,
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Admin endpoints
    // ----------------------------------------------------------

    /**
     * GET /api/admin/escrow
     * List all escrows (admin only, no user filter).
     */
    adminListEscrows = async (req: Request, res: Response): Promise<Response> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const status = req.query.status as EscrowStatus | undefined;

            const result = await escrowService.listEscrows({
                status,
                page,
                limit,
                role: "all",
            });

            return res.status(200).json({
                success: true,
                data: {
                    escrows: result.escrows.map((e) => this.formatEscrow(e)),
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * POST /api/admin/escrow/:id/resolve
     * Resolve a dispute (admin only).
     * Body: { resolution, notes?, splitPercent? }
     */
    adminResolveDispute = async (req: Request, res: Response): Promise<Response> => {
        try {
            const escrowId = parseInt(req.params.id, 10);
            if (isNaN(escrowId)) {
                return res.status(400).json({ success: false, error: "Invalid escrow ID" });
            }

            const { resolution, notes, splitPercent } = req.body;
            if (!resolution) {
                return res.status(400).json({ success: false, error: "Resolution is required" });
            }

            await escrowService.resolveDispute(escrowId, req.userId!, {
                resolution: resolution as DisputeResolution,
                notes,
                splitPercent,
            });

            return res.status(200).json({
                success: true,
                message: "Dispute resolved successfully.",
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * GET /api/admin/escrow/stats
     * Platform-wide financial statistics (admin only).
     */
    adminGetStats = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const stats = await escrowService.getAdminStats();
            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            return this.handleError(error, res);
        }
    };

    // ----------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------

    /**
     * Format an escrow for API response.
     * Strips sensitive fields and converts kobo to KES for display.
     */
    private formatEscrow(escrow: any): Record<string, any> {
        return {
            id: escrow.id,
            status: escrow.status,
            totalAmount: Number(escrow.totalAmount),
            totalAmountKES: Number(escrow.totalAmount) / 100,
            feeAmount: Number(escrow.feeAmount),
            feeAmountKES: Number(escrow.feeAmount) / 100,
            sellerAmount: Number(escrow.sellerAmount),
            sellerAmountKES: Number(escrow.sellerAmount) / 100,
            currency: escrow.currency,
            title: escrow.title,
            buyer: escrow.buyer
                ? { id: escrow.buyer.id, firstName: escrow.buyer.firstName, lastName: escrow.buyer.lastName, email: escrow.buyer.email }
                : undefined,
            seller: escrow.seller
                ? { id: escrow.seller.id, firstName: escrow.seller.firstName, lastName: escrow.seller.lastName, email: escrow.seller.email }
                : undefined,
            jobId: escrow.jobId,
            campaignId: escrow.campaignId,
            serviceRequestId: escrow.serviceRequestId,
            deliveryNote: escrow.deliveryNote,
            autoReleaseAt: escrow.autoReleaseAt,
            inspectionPeriodDays: escrow.inspectionPeriodDays,
            disputeReason: escrow.disputeReason,
            disputeResolution: escrow.disputeResolution,
            milestonePayments: escrow.milestonePayments,
            createdAt: escrow.createdAt,
            updatedAt: escrow.updatedAt,
        };
    }

    /**
     * Map service-layer errors to HTTP responses.
     */
    private handleError(error: unknown, res: Response): Response {
        if (error instanceof EscrowNotFoundError) {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error instanceof EscrowValidationError) {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error instanceof EscrowAuthorizationError) {
            return res.status(403).json({ success: false, error: error.message });
        }
        if (error instanceof EscrowStateError) {
            return res.status(409).json({ success: false, error: error.message });
        }
        if (error instanceof PaystackError) {
            return res.status(502).json({ success: false, error: error.message });
        }

        console.error("[EscrowController] Unexpected error:", error);
        return res.status(500).json({
            success: false,
            error: "An unexpected error occurred",
        });
    }
};

export default new EscrowController();
