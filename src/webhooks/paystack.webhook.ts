/**
 * Paystack Webhook Handler
 *
 * Receives and processes events from Paystack.
 *
 * Features:
 *  - HMAC-SHA512 Signature Verification
 *  - Idempotency via WebhookLog
 *  - Event handlers for:
 *      - charge.success (Payment confirmed)
 *      - transfer.success (Payout confirmed)
 *      - transfer.failed (Payout failed)
 *      - transfer.reversed (Payout reversed)
 *      - refund.processed (Refund confirmed)
 */

import { Request, Response } from "express";
import * as crypto from "crypto";
import { WebhookLog } from "../db/entity/WebhookLog.entity";
import { EscrowTransaction, EscrowStatus } from "../db/entity/EscrowTransaction.entity";
import { EscrowMilestonePayment, MilestonePaymentStatus } from "../db/entity/EscrowMilestonePayment.entity";
import escrowService from "../services/escrow.service";
import notificationService from "../services/notification.service";
import { EscrowEvent } from "../db/entity/EscrowEvent.entity";

/**
 * @swagger
 * /webhooks/paystack:
 *   post:
 *     summary: Handle Paystack events
 *     description: |
 *       Receives webhook events from Paystack. verify signature via HMAC-SHA512.
 *       Supported events: charge.success, transfer.success, transfer.failed, refund.processed.
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: charge.success
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Event received
 *       401:
 *         description: Invalid signature
 */
export async function paystackWebhookHandler(req: Request, res: Response): Promise<void> {
    // 1. Validate Signature
    // Paystack sends the hash of the raw body in x-paystack-signature
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const signature = req.headers["x-paystack-signature"];

    if (!signature || typeof signature !== "string") {
        console.error("[Webhook] Missing signature");
        res.status(401).json({ error: "Missing signature" });
        return; // Don't process
    }

    // Compute hash of the raw body
    // Note: req.body must be the raw Buffer at this point.
    // In app.ts, we use express.raw({ type: 'application/json' }) for this route.
    const computedHash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

    if (computedHash !== signature) {
        console.error("[Webhook] Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return; // Don't process
    }

    // 2. Respond 200 Immediately
    // Paystack timeouts are short. We must acknowledge receipt quickly.
    // Processing happens asynchronously below.
    res.sendStatus(200);

    // 3. Parse Body & Idempotency Check
    let event: any;
    try {
        event = JSON.parse(req.body.toString());
    } catch (err) {
        console.error("[Webhook] Failed to parse JSON body", err);
        return;
    }

    const { event: eventType, data } = event;
    const reference = data.reference || data.transaction_reference; // Refund uses transaction_reference

    if (!reference) {
        console.warn(`[Webhook] Event ${eventType} verified but missing reference. Skipping.`);
        return;
    }

    // Deduplicate
    try {
        const log = new WebhookLog();
        log.provider = "paystack";
        log.eventType = eventType;
        log.reference = reference;
        log.payload = event;
        log.processed = false;

        // Use a transaction or careful insert to avoid race conditions if needed.
        // Unique constraint on (provider, eventType, reference) will throw if duplicate.
        await log.save();
    } catch (err: any) {
        if (err.code === "23505") { // Postgres unique_violation
            console.log(`[Webhook] Duplicate event ${eventType} ref ${reference}. Skipping.`);
            return;
        }
        console.error("[Webhook] Failed to log webhook", err);
        // Continue processing? Ideally yes, but if we can't log, we might want to be careful.
        // For now, we proceed to ensure the business logic runs.
    }

    // 4. Process Event
    try {
        console.log(`[Webhook] Processing ${eventType} for ref ${reference}`);

        switch (eventType) {
            case "charge.success":
                await handleChargeSuccess(data);
                break;

            case "transfer.success":
                await handleTransferSuccess(data);
                break;

            case "transfer.failed":
            case "transfer.reversed":
                await handleTransferFailed(data, eventType);
                break;

            case "refund.processed":
                await handleRefundProcessed(data);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }

        // Mark as processed
        await WebhookLog.update(
            { provider: "paystack", eventType, reference },
            { processed: true }
        );

    } catch (err: any) {
        console.error(`[Webhook] Error processing ${eventType} ref ${reference}:`, err);
        // Log error to DB for manual review
        await WebhookLog.update(
            { provider: "paystack", eventType, reference },
            { error: err.message || "Unknown error" }
        );
    }
}

// ------------------------------------------------------------
// Event Handlers
// ------------------------------------------------------------

/**
 * Handle successful payment from buyer.
 * Marks escrow as FUNDED.
 */
async function handleChargeSuccess(data: any) {
    const reference = data.reference;

    // Verify and mark funded (idempotent)
    // This internally calls Paystack verify API for double-check
    // and updates status + notifications.
    const transaction = await EscrowTransaction.findOne({ where: { paystackPaymentRef: reference } });

    if (!transaction) {
        console.warn(`[Webhook] Charge success for unknown ref ${reference}`);
        return;
    }

    if (transaction.status !== "pending") {
        // Already funded or further along
        return;
    }

    // Update payment timestamp
    await EscrowTransaction.update(
        { id: transaction.id },
        { paymentConfirmedAt: new Date() }
    );

    // Call the core service method to handle the transition
    await escrowService.verifyAndMarkFunded(transaction.id, transaction.buyerId);

    // Note: verifyAndMarkFunded already sends 'escrow_funded' to seller.
    // We should also notify the buyer explicitly about payment success.
    await notificationService.create({
        userId: transaction.buyerId,
        type: "payment.confirmed",
        title: "Payment Confirmed",
        message: `Your payment of KES ${(data.amount / 100).toLocaleString()} for "${transaction.title}" has been confirmed.`,
        escrowId: transaction.id,
        metadata: { amount: data.amount, currency: "KES" }
    });
}

/**
 * Handle successful payout to seller.
 */
async function handleTransferSuccess(data: any) {
    const reference = data.reference;

    // Check Main Escrow
    const transaction = await EscrowTransaction.findOne({ where: { paystackTransferRef: reference } });
    if (transaction) {
        await EscrowTransaction.update(
            { id: transaction.id },
            { transferConfirmedAt: new Date() }
        );

        // Initial release happened when funds were released.
        // This just confirms the specific transfer succeeded.
        await logEvent(transaction.id, null, "transfer_confirmed", undefined, data);

        await notificationService.create({
            userId: transaction.sellerId,
            type: "payout.confirmed",
            title: "Payout Confirmed",
            message: `KES ${(data.amount / 100).toLocaleString()} has been successfully sent to your account.`,
            escrowId: transaction.id,
            metadata: { amount: data.amount }
        });
        return;
    }

    // Check Milestone
    const milestone = await EscrowMilestonePayment.findOne({
        where: { paystackTransferRef: reference },
        relations: ["escrow"]
    });

    if (milestone) {
        // Log verification? Milestone entity doesn't have transferConfirmedAt,
        // maybe we just log the event.
        await logEvent(milestone.escrow.id, milestone.id, "milestone_transfer_confirmed", undefined, data);

        await notificationService.create({
            userId: milestone.escrow.sellerId,
            type: "payout.confirmed",
            title: "Milestone Payout Confirmed",
            message: `KES ${(data.amount / 100).toLocaleString()} for milestone has been sent to your account.`,
            escrowId: milestone.escrow.id,
            metadata: { amount: data.amount, milestoneId: milestone.id }
        });
        return;
    }
    console.warn(`[Webhook] Transfer success for unknown ref ${reference}`);
}

/**
 * Handle failed or reversed payout.
 * CRITICAL: Revert status to FUNDED (money is back in balance).
 */
async function handleTransferFailed(data: any, originalEventType: string) {
    const reference = data.reference;
    const reason = data.reason || "Unknown transfer failure";

    // Check Main Escrow
    const transaction = await EscrowTransaction.findOne({ where: { paystackTransferRef: reference } });
    if (transaction) {
        if (transaction.status !== "funded") {
            // Revert status to FUNDED so it can be retried
            transaction.status = EscrowStatus.FUNDED; // Was 'released' or 'completed'
            transaction.transferFailedAt = new Date();
            transaction.transferFailReason = reason;
            await transaction.save();
        }

        await logEvent(transaction.id, null, "transfer_failed", undefined, { reason, originalEventType });

        // Notify Admin
        await notificationService.create({
            userId: 1, // Assumes Admin ID 1, need better admin resolution
            type: "transfer_failed_admin",
            title: "Transfer Failed",
            message: `⚠️ Transfer failed for escrow #${transaction.id}. Amount: KES ${(data.amount / 100)}. Reason: ${reason}.`,
            escrowId: transaction.id,
            metadata: { reason }
        });

        // Notify Seller
        await notificationService.create({
            userId: transaction.sellerId,
            type: "payout.failed",
            title: "Payout Failed",
            message: `Your payout of KES ${(data.amount / 100).toLocaleString()} failed. Our team has been notified and will resolve this within 24 hours.`,
            escrowId: transaction.id,
            metadata: { reason }
        });
        return;
    }

    // Check Milestone
    const milestone = await EscrowMilestonePayment.findOne({
        where: { paystackTransferRef: reference },
        relations: ["escrow"]
    });

    if (milestone) {
        // Revert to 'delivered' so the release can be retried.
        // The funds are still in the Paystack balance.
        milestone.status = MilestonePaymentStatus.DELIVERED;
        await milestone.save();

        await logEvent(milestone.escrow.id, milestone.id, "milestone_transfer_failed", undefined, { reason });

        // Notify Seller (same as above)
        await notificationService.create({
            userId: milestone.escrow.sellerId,
            type: "payout.failed",
            title: "Milestone Payout Failed",
            message: `Your milestone payout of KES ${(data.amount / 100).toLocaleString()} failed. Team notified.`,
            escrowId: milestone.escrow.id,
            metadata: { reason }
        });
        return;
    }
}

/**
 * Handle processed refund.
 */
async function handleRefundProcessed(data: any) {
    // data.transaction_reference is the payment ref
    const reference = data.transaction_reference;

    const transaction = await EscrowTransaction.findOne({ where: { paystackPaymentRef: reference } });
    if (!transaction) return;

    if (transaction.status !== EscrowStatus.REFUNDED) {
        transaction.status = EscrowStatus.REFUNDED;
        transaction.refundConfirmedAt = new Date();
        await transaction.save();

        await logEvent(transaction.id, null, "refund_confirmed", undefined, data);
    } else {
        // Already marked, just update timestamp if missing
        if (!transaction.refundConfirmedAt) {
            await EscrowTransaction.update({ id: transaction.id }, { refundConfirmedAt: new Date() });
        }
    }

    await notificationService.create({
        userId: transaction.buyerId,
        type: "refund.confirmed",
        title: "Refund Confirmed",
        message: `Your refund of KES ${(data.amount / 100).toLocaleString()} for "${transaction.title}" has been processed successfully.`,
        escrowId: transaction.id,
        metadata: { amount: data.amount }
    });
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function logEvent(
    escrowId: number,
    milestoneId: number | null,
    action: string,
    actorId?: number,
    details?: any
) {
    const event = new EscrowEvent();
    event.escrowId = escrowId;
    event.milestonePaymentId = milestoneId;
    event.actorId = actorId || null; // System action = null
    event.eventType = action;
    event.metadata = details || {};
    event.ipAddress = "127.0.0.1"; // Webhook
    await event.save();
}
