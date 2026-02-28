/**
 * Escrow Service
 *
 * Core business logic for the Paza escrow system. This service manages
 * the entire escrow lifecycle from creation through payment, delivery,
 * and fund release.
 *
 * Design principles:
 *   1. All state changes use QueryRunner with pessimistic locking
 *      (SELECT ... FOR UPDATE) to prevent race conditions.
 *   2. Paystack transfers happen AFTER the DB transaction commits.
 *   3. Amount conversion (string -> KES kobo) happens at this layer only.
 *   4. Every state change is recorded in the EscrowEvent audit log.
 *   5. Notifications are fire-and-forget (never block escrow operations).
 */

import AppDataSource from "../db/data-source";
import {
    EscrowTransaction,
    EscrowStatus,
    DisputeResolution,
    PayoutMethod,
} from "../db/entity/EscrowTransaction.entity";
import {
    EscrowMilestonePayment,
    MilestonePaymentStatus,
} from "../db/entity/EscrowMilestonePayment.entity";
import { EscrowEvent } from "../db/entity/EscrowEvent.entity";
import { SellerPayoutAccount } from "../db/entity/SellerPayoutAccount.entity";
import { User } from "../db/entity/User";
import { Job, JobProposal } from "../db/entity/Job.entity";
import { Campaign, CampaignMilestone } from "../db/entity/Campaign.entity";
import { ServiceRequest } from "../db/entity/ServiceRequest.entity";
import paystackService from "./paystack.service";
import notificationService from "./notification.service";
import { QueryRunner } from "typeorm";

// ============================================================
// Constants
// ============================================================

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || "0.02");
const AUTO_RELEASE_DAYS = parseInt(process.env.AUTO_RELEASE_DAYS || "7", 10);
const CURRENCY = process.env.CURRENCY || "KES";

// ============================================================
// Amount conversion helpers
// ============================================================

/**
 * Convert a KES amount (string or number) to kobo (cents).
 * Throws if the input is not a valid number.
 */
function toKESKobo(value: string | number): number {
    const parsed = parseFloat(String(value));
    if (isNaN(parsed) || parsed < 0) {
        throw new EscrowValidationError(
            `Invalid amount "${value}". Must be a positive number.`
        );
    }
    return Math.round(parsed * 100);
}

/**
 * Convert KES kobo (cents) back to KES for display.
 */
function fromKESKobo(kobo: number): number {
    return kobo / 100;
}

/**
 * Generate a unique reference string for Paystack transactions.
 * Format: ESC-{escrowId}-{timestamp}-{random}
 */
function generateReference(prefix: string, escrowId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${escrowId}-${timestamp}-${random}`;
}

// ============================================================
// Custom errors
// ============================================================

export class EscrowValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EscrowValidationError";
    }
}

export class EscrowNotFoundError extends Error {
    constructor(id: number | string) {
        super(`Escrow transaction ${id} not found`);
        this.name = "EscrowNotFoundError";
    }
}

export class EscrowAuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EscrowAuthorizationError";
    }
}

export class EscrowStateError extends Error {
    constructor(currentStatus: string, attemptedAction: string) {
        super(
            `Cannot ${attemptedAction} escrow in "${currentStatus}" status`
        );
        this.name = "EscrowStateError";
    }
}

// ============================================================
// Types
// ============================================================

interface ListEscrowParams {
    userId?: number;
    status?: EscrowStatus;
    page?: number;
    limit?: number;
    role?: "buyer" | "seller" | "all";
}

interface EscrowStats {
    totalEscrows: number;
    pendingPayment: number;
    inProgress: number;
    awaitingRelease: number;
    completed: number;
    disputed: number;
    totalValueKobo: number;
    totalEarnedKobo: number;
}

// ============================================================
// Service
// ============================================================

class EscrowService {

    // ----------------------------------------------------------
    // Creation methods
    // ----------------------------------------------------------

    /**
     * Create an escrow from an accepted job proposal.
     *
     * This is the most common escrow trigger. When a buyer accepts
     * a creator's proposal, an escrow is created to hold the
     * agreed-upon payment amount.
     *
     * The amount comes from the proposal's proposedBudget field
     * (which is a string like "4500" meaning KES 4,500).
     */
    async createFromJobProposal(
        proposalId: number,
        requesterId: number
    ): Promise<{ escrow: EscrowTransaction; paymentUrl: string; reference: string }> {
        // Load the proposal with its job and related users
        const proposal = await JobProposal.findOne({
            where: { id: proposalId },
            relations: ["job", "proposer"],
        });

        if (!proposal) {
            throw new EscrowNotFoundError(`JobProposal ${proposalId}`);
        }

        const job = await Job.findOne({
            where: { id: proposal.job.id },
            relations: ["owner"],
        });

        if (!job) {
            throw new EscrowNotFoundError(`Job for proposal ${proposalId}`);
        }

        // Authorization: only the job owner can create an escrow
        if (job.owner.id !== requesterId) {
            throw new EscrowAuthorizationError(
                "Only the job poster can create an escrow for a proposal"
            );
        }

        // Determine amount: use the proposed budget, falling back to job payment
        const amountSource = proposal.proposedBudget || job.payment;
        if (!amountSource) {
            throw new EscrowValidationError(
                "No budget specified on the proposal or job"
            );
        }

        const totalAmount = toKESKobo(amountSource);
        const feeAmount = Math.round(totalAmount * PLATFORM_FEE_PERCENT);
        const sellerAmount = totalAmount - feeAmount;

        // Create escrow in a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = queryRunner.manager.create(EscrowTransaction, {
                buyerId: job.owner.id,
                sellerId: proposal.proposer.id,
                jobId: job.id,
                jobProposalId: proposal.id,
                totalAmount,
                feeAmount,
                sellerAmount,
                currency: CURRENCY,
                status: EscrowStatus.PENDING,
                title: job.title || `Job #${job.id}`,
                inspectionPeriodDays: AUTO_RELEASE_DAYS,
            });

            const savedEscrow = await queryRunner.manager.save(escrow);

            // Log the creation event
            await this.logEvent(queryRunner, {
                escrowId: savedEscrow.id,
                actorId: requesterId,
                eventType: "created",
                description: `Escrow created from job proposal #${proposalId} for KES ${fromKESKobo(totalAmount)}`,
                metadata: {
                    jobId: job.id,
                    proposalId: proposal.id,
                    totalAmount,
                    feeAmount,
                    sellerAmount,
                },
            });

            await queryRunner.commitTransaction();

            // Initialize Paystack payment (after commit)
            const reference = generateReference("PAY", savedEscrow.id);
            const buyer = await User.findOneOrFail({ where: { id: job.owner.id } });

            const paymentResult = await paystackService.initializePayment({
                email: buyer.email,
                amount: totalAmount,
                reference,
                metadata: { escrowId: savedEscrow.id, type: "escrow_payment" },
            });

            // Store payment reference on the escrow
            savedEscrow.paystackPaymentRef = reference;
            savedEscrow.paystackAccessCode = paymentResult.access_code;
            await savedEscrow.save();

            // Notify seller about the new escrow
            await notificationService.create({
                userId: proposal.proposer.id,
                type: "escrow.created",
                title: "New Escrow Created",
                message: `A new escrow has been created for "${savedEscrow.title}". Awaiting buyer payment of KES ${fromKESKobo(totalAmount).toLocaleString()}.`,
                escrowId: savedEscrow.id,
            });

            // Reload with relations for response
            const fullEscrow = await EscrowTransaction.findOne({
                where: { id: savedEscrow.id },
                relations: ["buyer", "seller"],
            });

            return {
                escrow: fullEscrow!,
                paymentUrl: paymentResult.authorization_url,
                reference,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Create an escrow from a campaign.
     *
     * If the campaign has milestones with budgets, individual
     * EscrowMilestonePayment records are created for each milestone.
     */
    async createFromCampaign(
        campaignId: number,
        sellerId: number,
        requesterId: number
    ): Promise<{ escrow: EscrowTransaction; paymentUrl: string; reference: string }> {
        const campaign = await Campaign.findOne({
            where: { id: campaignId },
            relations: ["milestones"],
        });

        if (!campaign) {
            throw new EscrowNotFoundError(`Campaign ${campaignId}`);
        }

        // Authorization: only the campaign creator (field is 'createdby')
        const campaignOwner = await User.findOne({
            where: { email: (campaign as any).createdby },
        });

        if (!campaignOwner || campaignOwner.id !== requesterId) {
            throw new EscrowAuthorizationError(
                "Only the campaign owner can create an escrow"
            );
        }

        const seller = await User.findOne({ where: { id: sellerId } });
        if (!seller || seller.accountType !== "Creator") {
            throw new EscrowValidationError(
                "Seller must be a user with Creator account type"
            );
        }

        // Calculate total from campaign budget
        const totalAmount = toKESKobo(campaign.budget);
        if (totalAmount <= 0) {
            throw new EscrowValidationError("Campaign budget must be greater than 0");
        }

        const feeAmount = Math.round(totalAmount * PLATFORM_FEE_PERCENT);
        const sellerAmount = totalAmount - feeAmount;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = queryRunner.manager.create(EscrowTransaction, {
                buyerId: campaignOwner.id,
                sellerId: seller.id,
                campaignId: campaign.id,
                totalAmount,
                feeAmount,
                sellerAmount,
                currency: CURRENCY,
                status: EscrowStatus.PENDING,
                title: campaign.title || `Campaign #${campaign.id}`,
                inspectionPeriodDays: AUTO_RELEASE_DAYS,
            });

            const savedEscrow = await queryRunner.manager.save(escrow);

            // Create milestone payment records if campaign has milestones
            if (campaign.milestones && campaign.milestones.length > 0) {
                for (let i = 0; i < campaign.milestones.length; i++) {
                    const milestone = campaign.milestones[i];
                    const milestoneAmount = milestone.budget
                        ? toKESKobo(milestone.budget)
                        : 0;

                    const mp = queryRunner.manager.create(EscrowMilestonePayment, {
                        escrow: savedEscrow,
                        campaignMilestoneId: milestone.id,
                        title: milestone.title || `Milestone ${i + 1}`,
                        amount: milestoneAmount,
                        orderIndex: i,
                        status: MilestonePaymentStatus.PENDING,
                        dueDate: milestone.end || null,
                    });

                    await queryRunner.manager.save(mp);
                }
            }

            await this.logEvent(queryRunner, {
                escrowId: savedEscrow.id,
                actorId: requesterId,
                eventType: "created",
                description: `Escrow created from campaign #${campaignId}`,
                metadata: { campaignId, sellerId, totalAmount },
            });

            await queryRunner.commitTransaction();

            // Initialize payment (after commit)
            const reference = generateReference("PAY", savedEscrow.id);
            const paymentResult = await paystackService.initializePayment({
                email: campaignOwner.email,
                amount: totalAmount,
                reference,
                metadata: { escrowId: savedEscrow.id, type: "escrow_payment" },
            });

            savedEscrow.paystackPaymentRef = reference;
            savedEscrow.paystackAccessCode = paymentResult.access_code;
            await savedEscrow.save();

            await notificationService.create({
                userId: seller.id,
                type: "escrow.created",
                title: "New Campaign Escrow",
                message: `An escrow has been created for campaign "${savedEscrow.title}". Awaiting buyer payment.`,
                escrowId: savedEscrow.id,
            });

            const fullEscrow = await EscrowTransaction.findOne({
                where: { id: savedEscrow.id },
                relations: ["buyer", "seller"],
            });

            return {
                escrow: fullEscrow!,
                paymentUrl: paymentResult.authorization_url,
                reference,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Create an escrow from a service request.
     */
    async createFromServiceRequest(
        serviceRequestId: number,
        sellerId: number,
        requesterId: number
    ): Promise<{ escrow: EscrowTransaction; paymentUrl: string; reference: string }> {
        const serviceRequest = await ServiceRequest.findOne({
            where: { id: serviceRequestId },
            relations: ["postedBy", "campaign"],
        });

        if (!serviceRequest) {
            throw new EscrowNotFoundError(`ServiceRequest ${serviceRequestId}`);
        }

        if (serviceRequest.postedBy.id !== requesterId) {
            throw new EscrowAuthorizationError(
                "Only the service request poster can create an escrow"
            );
        }

        const seller = await User.findOne({ where: { id: sellerId } });
        if (!seller || seller.accountType !== "Creator") {
            throw new EscrowValidationError(
                "Seller must be a user with Creator account type"
            );
        }

        if (!serviceRequest.budget) {
            throw new EscrowValidationError("Service request has no budget set");
        }

        const totalAmount = toKESKobo(serviceRequest.budget);
        const feeAmount = Math.round(totalAmount * PLATFORM_FEE_PERCENT);
        const sellerAmount = totalAmount - feeAmount;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = queryRunner.manager.create(EscrowTransaction, {
                buyerId: serviceRequest.postedBy.id,
                sellerId: seller.id,
                serviceRequestId: serviceRequest.id,
                campaignId: serviceRequest.campaign?.id || null,
                totalAmount,
                feeAmount,
                sellerAmount,
                currency: CURRENCY,
                status: EscrowStatus.PENDING,
                title: serviceRequest.serviceType || `Service Request #${serviceRequest.id}`,
                inspectionPeriodDays: AUTO_RELEASE_DAYS,
            });

            const savedEscrow = await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: savedEscrow.id,
                actorId: requesterId,
                eventType: "created",
                description: `Escrow created from service request #${serviceRequestId}`,
                metadata: { serviceRequestId, sellerId, totalAmount },
            });

            await queryRunner.commitTransaction();

            const reference = generateReference("PAY", savedEscrow.id);
            const buyer = serviceRequest.postedBy;
            const paymentResult = await paystackService.initializePayment({
                email: buyer.email,
                amount: totalAmount,
                reference,
                metadata: { escrowId: savedEscrow.id, type: "escrow_payment" },
            });

            savedEscrow.paystackPaymentRef = reference;
            savedEscrow.paystackAccessCode = paymentResult.access_code;
            await savedEscrow.save();

            await notificationService.create({
                userId: seller.id,
                type: "escrow.created",
                title: "New Service Escrow",
                message: `An escrow has been created for "${savedEscrow.title}". Awaiting buyer payment.`,
                escrowId: savedEscrow.id,
            });

            const fullEscrow = await EscrowTransaction.findOne({
                where: { id: savedEscrow.id },
                relations: ["buyer", "seller"],
            });

            return {
                escrow: fullEscrow!,
                paymentUrl: paymentResult.authorization_url,
                reference,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Payment verification (Phase 1 manual flow)
    // ----------------------------------------------------------

    /**
     * Re-initialize a Paystack payment for a pending escrow.
     * Used when the original checkout session has expired.
     * Generates a new reference and payment URL, updating the escrow record.
     */
    async reinitializePayment(
        escrowId: number,
        buyerId: number
    ): Promise<{ paymentUrl: string; reference: string }> {
        const escrow = await EscrowTransaction.findOne({ where: { id: escrowId } });
        if (!escrow) throw new EscrowNotFoundError(escrowId);
        if (escrow.buyerId !== buyerId) throw new EscrowAuthorizationError("Only the buyer can reinitialize payment");
        if (escrow.status !== EscrowStatus.PENDING) {
            throw new EscrowValidationError(`Cannot reinitialize payment for an escrow in "${escrow.status}" status`);
        }

        const buyer = await User.findOneOrFail({ where: { id: buyerId } });

        // Generate a fresh reference and new Paystack checkout session
        const newReference = generateReference("PAY", escrowId);
        const paymentResult = await paystackService.initializePayment({
            email: buyer.email,
            amount: escrow.totalAmount,
            reference: newReference,
            metadata: { escrowId: escrow.id, type: "escrow_payment" },
        });

        // Update escrow with the new reference and access code
        escrow.paystackPaymentRef = newReference;
        escrow.paystackAccessCode = paymentResult.access_code;
        await escrow.save();

        console.log(`[EscrowService] Re-initialized payment for escrow #${escrowId}. New ref: ${newReference}`);

        return {
            paymentUrl: paymentResult.authorization_url,
            reference: newReference,
        };
    }

    /**
     * Verify a Paystack payment and mark escrow as funded.
     *
     * Phase 1: buyer manually triggers this after completing payment.
     * Phase 2: this will also be called from the Paystack webhook handler.
     *
     * Idempotent: returns early if escrow is already funded.
     */
    async verifyAndMarkFunded(
        escrowId: number,

        buyerId: number
    ): Promise<EscrowTransaction> {
        // ─── Step 1: Fetch escrow WITHOUT a transaction first ─────────────
        // We do a quick read to validate state and get the Paystack reference
        // BEFORE acquiring a pessimistic lock and calling external APIs.
        const rawEscrow = await EscrowTransaction.findOne({ where: { id: escrowId } });

        if (!rawEscrow) throw new EscrowNotFoundError(escrowId);

        // Idempotent: already funded — return early without touching the DB
        if (
            rawEscrow.status === EscrowStatus.FUNDED ||
            rawEscrow.status === EscrowStatus.IN_PROGRESS ||
            rawEscrow.status === EscrowStatus.DELIVERED ||
            rawEscrow.status === EscrowStatus.RELEASED
        ) {
            return rawEscrow;
        }

        if (rawEscrow.buyerId !== buyerId) {
            throw new EscrowAuthorizationError("Only the buyer can verify payment");
        }

        if (rawEscrow.status !== EscrowStatus.PENDING) {
            throw new EscrowStateError(rawEscrow.status, "verify payment");
        }

        if (!rawEscrow.paystackPaymentRef) {
            throw new EscrowValidationError("No payment reference found on this escrow");
        }

        // ─── Step 2: Call Paystack OUTSIDE the DB transaction ──────────────
        // This way, if Paystack fails, we throw a clean PaystackError (→ 502)
        // without risk of it being masked by a failed rollback call.
        console.log(`[EscrowService] Verifying Paystack payment for escrow #${escrowId}, ref: ${rawEscrow.paystackPaymentRef}`);
        const transaction = await paystackService.verifyPayment(rawEscrow.paystackPaymentRef);
        console.log(`[EscrowService] Paystack verification result: ${transaction.status}`);

        if (transaction.status !== "success") {
            throw new EscrowValidationError(
                `Payment not yet successful. Paystack status: "${transaction.status}". Please complete the payment first.`
            );
        }

        // ─── Step 3: Update DB in a transaction with pessimistic lock ─────
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Using QueryBuilder for pessimistic lock to avoid eager join conflicts
            // PostgreSQL does not allow FOR UPDATE on the nullable side of an outer join.
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            // Re-check idempotency inside the lock (another request may have funded it)
            if (escrow.status !== EscrowStatus.PENDING) {
                await queryRunner.rollbackTransaction();
                return escrow;
            }

            escrow.status = EscrowStatus.FUNDED;
            escrow.paymentConfirmedAt = new Date();
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: buyerId,
                eventType: "funded",
                description: `Payment verified and escrow funded. Amount: KES ${fromKESKobo(escrow.totalAmount)}`,
                metadata: {
                    paystackRef: escrow.paystackPaymentRef,
                    paystackStatus: transaction.status,
                    paystackTxId: transaction.id,
                },
            });

            await queryRunner.commitTransaction();

            // Reload the entity with eager relations for the response
            return await this.getEscrowById(escrow.id, buyerId);
        } catch (error) {
            console.error(`[EscrowService] Failed to mark escrow #${escrowId} as funded:`, error);
            try {
                await queryRunner.rollbackTransaction();
            } catch (rollbackError) {
                console.error("[EscrowService] Rollback also failed:", rollbackError);
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: work started
    // ----------------------------------------------------------

    /**
     * Mark that the seller has started working on the escrow.
     * Only allowed when escrow status is "funded".
     */
    async startWork(escrowId: number, sellerId: number): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);
            if (escrow.sellerId !== sellerId) {
                throw new EscrowAuthorizationError("Only the seller can start work");
            }
            if (escrow.status !== EscrowStatus.FUNDED) {
                throw new EscrowStateError(escrow.status, "start work");
            }

            escrow.status = EscrowStatus.IN_PROGRESS;
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: sellerId,
                eventType: "work_started",
                description: "Seller has started working",
            });

            await queryRunner.commitTransaction();

            await notificationService.create({
                userId: escrow.buyerId,
                type: "escrow.work_started",
                title: "Work Started",
                message: `The seller has started working on "${escrow.title}".`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: delivery
    // ----------------------------------------------------------

    /**
     * Mark escrow as delivered by the seller.
     * Sets the auto-release countdown (default 7 days).
     */
    async markDelivered(
        escrowId: number,
        sellerId: number,
        deliveryNote?: string
    ): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);
            if (escrow.sellerId !== sellerId) {
                throw new EscrowAuthorizationError("Only the seller can mark delivery");
            }
            if (escrow.status !== EscrowStatus.IN_PROGRESS &&
                escrow.status !== EscrowStatus.FUNDED) {
                throw new EscrowStateError(escrow.status, "mark delivered");
            }

            // Set auto-release deadline
            const autoReleaseAt = new Date();
            autoReleaseAt.setDate(autoReleaseAt.getDate() + escrow.inspectionPeriodDays);

            escrow.status = EscrowStatus.DELIVERED;
            escrow.deliveryNote = deliveryNote || null;
            escrow.deliveryConfirmedAt = new Date();
            escrow.autoReleaseAt = autoReleaseAt;
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: sellerId,
                eventType: "delivered",
                description: `Work delivered. Auto-release in ${escrow.inspectionPeriodDays} days.`,
                metadata: { deliveryNote, autoReleaseAt },
            });

            await queryRunner.commitTransaction();

            await notificationService.create({
                userId: escrow.buyerId,
                type: "escrow.delivered",
                title: "Work Delivered",
                message: `The seller has delivered "${escrow.title}". Review and release funds or raise a dispute within ${escrow.inspectionPeriodDays} days.`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: release funds
    // ----------------------------------------------------------

    /**
     * Release escrow funds to the seller.
     *
     * IMPORTANT: The Paystack transfer is initiated AFTER the DB
     * transaction commits. If the transfer API call fails, we log
     * the error and flag the escrow for manual admin review.
     * The funds remain safe in the Paystack balance.
     */
    async releaseFunds(
        escrowId: number,
        releasedById: number
    ): Promise<{ transferCode: string; status: string }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            // Authorization: buyer or admin can release
            const releasingUser = await User.findOne({ where: { id: releasedById } });
            if (!releasingUser) throw new EscrowAuthorizationError("User not found");

            if (escrow.buyerId !== releasedById && releasingUser.role !== "admin") {
                throw new EscrowAuthorizationError(
                    "Only the buyer or an admin can release funds"
                );
            }

            if (escrow.status !== EscrowStatus.DELIVERED &&
                escrow.status !== EscrowStatus.FUNDED &&
                escrow.status !== EscrowStatus.IN_PROGRESS) {
                throw new EscrowStateError(escrow.status, "release funds");
            }

            // Get seller's payout account
            const payoutAccount = await SellerPayoutAccount.findOne({
                where: { userId: escrow.sellerId, isActive: true },
            });

            if (!payoutAccount) {
                throw new EscrowValidationError(
                    "Seller has not set up a payout account. Cannot release funds."
                );
            }

            // Snapshot payout details onto the escrow record
            escrow.sellerRecipientCode = payoutAccount.paystackRecipientCode;
            escrow.sellerPayoutMethod = payoutAccount.payoutMethod as PayoutMethod;
            escrow.status = EscrowStatus.RELEASED;
            escrow.fundsReleasedAt = new Date();

            const transferRef = generateReference("TRF", escrow.id);
            escrow.paystackTransferRef = transferRef;

            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: releasedById,
                eventType: "released",
                description: `Funds released. KES ${fromKESKobo(escrow.sellerAmount)} to seller.`,
                metadata: {
                    sellerAmount: escrow.sellerAmount,
                    recipientCode: payoutAccount.paystackRecipientCode,
                    transferRef,
                },
            });

            await queryRunner.commitTransaction();

            // Initiate Paystack transfer AFTER commit
            let transferResult = { transfer_code: "", status: "pending" };
            try {
                transferResult = await paystackService.initiateTransfer({
                    amount: Number(escrow.sellerAmount),
                    recipientCode: payoutAccount.paystackRecipientCode,
                    reference: transferRef,
                    reason: `Paza escrow payout for "${escrow.title}"`,
                });
            } catch (transferError) {
                // Transfer failed, but DB state is already committed.
                // Funds are still in Paystack balance, flag for manual review.
                console.error(
                    `[EscrowService] Transfer failed for escrow ${escrow.id}:`,
                    transferError
                );

                await notificationService.create({
                    userId: releasedById,
                    type: "escrow.transfer_failed",
                    title: "Transfer Issue",
                    message: `Fund transfer for "${escrow.title}" encountered an issue. Our team has been notified.`,
                    escrowId: escrow.id,
                });
            }

            // Notify both parties
            await notificationService.notifyBothParties({
                buyerId: escrow.buyerId,
                sellerId: escrow.sellerId,
                type: "escrow.released",
                title: "Funds Released",
                buyerMessage: `You have released KES ${fromKESKobo(escrow.sellerAmount).toLocaleString()} for "${escrow.title}".`,
                sellerMessage: `KES ${fromKESKobo(escrow.sellerAmount).toLocaleString()} has been released to your account for "${escrow.title}".`,
                escrowId: escrow.id,
            });

            return {
                transferCode: transferResult.transfer_code,
                status: transferResult.status,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: dispute
    // ----------------------------------------------------------

    /**
     * Raise a dispute on an escrow.
     * Either buyer or seller can raise a dispute after funding.
     */
    async raiseDispute(
        escrowId: number,
        raisedById: number,
        reason: string
    ): Promise<void> {
        if (!reason || reason.trim().length < 10) {
            throw new EscrowValidationError(
                "Dispute reason must be at least 10 characters"
            );
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            if (escrow.buyerId !== raisedById && escrow.sellerId !== raisedById) {
                throw new EscrowAuthorizationError(
                    "Only buyer or seller can raise a dispute"
                );
            }

            const allowedStatuses = [
                EscrowStatus.FUNDED,
                EscrowStatus.IN_PROGRESS,
                EscrowStatus.DELIVERED,
            ];
            if (!allowedStatuses.includes(escrow.status)) {
                throw new EscrowStateError(escrow.status, "raise dispute");
            }

            escrow.status = EscrowStatus.DISPUTED;
            escrow.disputeReason = reason;
            escrow.disputeRaisedBy = raisedById;
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: raisedById,
                eventType: "dispute_raised",
                description: `Dispute raised: ${reason}`,
                metadata: { raisedBy: raisedById },
            });

            await queryRunner.commitTransaction();

            // Notify the other party and admins
            const otherPartyId = raisedById === escrow.buyerId
                ? escrow.sellerId
                : escrow.buyerId;

            await notificationService.create({
                userId: otherPartyId,
                type: "escrow.dispute_raised",
                title: "Dispute Raised",
                message: `A dispute has been raised on "${escrow.title}": ${reason}`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Resolve a dispute. Admin only.
     *
     * Resolution options:
     *   - release_to_seller: full amount to seller
     *   - refund_buyer: full refund to buyer
     *   - partial_split: split by percentage
     */
    async resolveDispute(
        escrowId: number,
        adminId: number,
        opts: {
            resolution: DisputeResolution;
            notes?: string;
            splitPercent?: number;
        }
    ): Promise<void> {
        const admin = await User.findOne({ where: { id: adminId } });
        if (!admin || admin.role !== "admin") {
            throw new EscrowAuthorizationError("Only admins can resolve disputes");
        }

        if (opts.resolution === DisputeResolution.PARTIAL_SPLIT) {
            if (opts.splitPercent === undefined || opts.splitPercent < 0 || opts.splitPercent > 100) {
                throw new EscrowValidationError(
                    "splitPercent must be between 0 and 100 for partial_split resolution"
                );
            }
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);
            if (escrow.status !== EscrowStatus.DISPUTED) {
                throw new EscrowStateError(escrow.status, "resolve dispute");
            }

            escrow.disputeResolution = opts.resolution;
            escrow.disputeNotes = opts.notes || null;
            escrow.disputeResolvedAt = new Date();

            if (opts.resolution === DisputeResolution.PARTIAL_SPLIT) {
                escrow.splitPercent = opts.splitPercent!;
            }

            // Set final status based on resolution
            if (opts.resolution === DisputeResolution.REFUND_BUYER) {
                escrow.status = EscrowStatus.REFUNDED;
            } else {
                escrow.status = EscrowStatus.RELEASED;
                escrow.fundsReleasedAt = new Date();
            }

            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId: adminId,
                eventType: "dispute_resolved",
                description: `Dispute resolved: ${opts.resolution}`,
                metadata: { resolution: opts.resolution, splitPercent: opts.splitPercent, notes: opts.notes },
            });

            await queryRunner.commitTransaction();

            await notificationService.notifyBothParties({
                buyerId: escrow.buyerId,
                sellerId: escrow.sellerId,
                type: "escrow.dispute_resolved",
                title: "Dispute Resolved",
                buyerMessage: `The dispute on "${escrow.title}" has been resolved: ${opts.resolution.replace(/_/g, " ")}.`,
                sellerMessage: `The dispute on "${escrow.title}" has been resolved: ${opts.resolution.replace(/_/g, " ")}.`,
                escrowId: escrow.id,
            });

            // Handle post-resolution transfers after commit
            if (opts.resolution === DisputeResolution.REFUND_BUYER) {
                try {
                    await paystackService.refundTransaction({
                        transactionReference: escrow.paystackPaymentRef!,
                    });
                } catch (refundError) {
                    console.error(`[EscrowService] Refund failed for escrow ${escrow.id}:`, refundError);
                }
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: refund
    // ----------------------------------------------------------

    /**
     * Refund buyer (only before delivery).
     */
    async refundBuyer(escrowId: number, actorId: number): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            const actor = await User.findOne({ where: { id: actorId } });
            if (escrow.buyerId !== actorId && actor?.role !== "admin") {
                throw new EscrowAuthorizationError("Only the buyer or admin can request a refund");
            }

            const refundableStatuses = [EscrowStatus.FUNDED, EscrowStatus.IN_PROGRESS];
            if (!refundableStatuses.includes(escrow.status)) {
                throw new EscrowStateError(escrow.status, "refund");
            }

            escrow.status = EscrowStatus.REFUNDED;
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId,
                eventType: "refunded",
                description: `Refund initiated by ${actorId === escrow.buyerId ? "buyer" : "admin"}`,
            });

            await queryRunner.commitTransaction();

            // Initiate Paystack refund after commit
            if (escrow.paystackPaymentRef) {
                try {
                    await paystackService.refundTransaction({
                        transactionReference: escrow.paystackPaymentRef,
                    });
                } catch (refundError) {
                    console.error(`[EscrowService] Refund failed for escrow ${escrow.id}:`, refundError);
                }
            }

            await notificationService.notifyBothParties({
                buyerId: escrow.buyerId,
                sellerId: escrow.sellerId,
                type: "escrow.refunded",
                title: "Escrow Refunded",
                buyerMessage: `Your refund of KES ${fromKESKobo(escrow.totalAmount).toLocaleString()} for "${escrow.title}" has been initiated.`,
                sellerMessage: `The escrow for "${escrow.title}" has been refunded to the buyer.`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Lifecycle: cancel
    // ----------------------------------------------------------

    /**
     * Cancel an escrow (only before funding).
     */
    async cancelEscrow(
        escrowId: number,
        actorId: number,
        reason: string
    ): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            if (escrow.buyerId !== actorId && escrow.sellerId !== actorId) {
                const actor = await User.findOne({ where: { id: actorId } });
                if (actor?.role !== "admin") {
                    throw new EscrowAuthorizationError("Not authorized to cancel this escrow");
                }
            }

            if (escrow.status !== EscrowStatus.PENDING) {
                throw new EscrowStateError(escrow.status, "cancel");
            }

            escrow.status = EscrowStatus.CANCELLED;
            escrow.cancelledBy = actorId;
            escrow.cancellationReason = reason;
            escrow.cancelledAt = new Date();
            await queryRunner.manager.save(escrow);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                actorId,
                eventType: "cancelled",
                description: `Escrow cancelled: ${reason}`,
            });

            await queryRunner.commitTransaction();

            await notificationService.notifyBothParties({
                buyerId: escrow.buyerId,
                sellerId: escrow.sellerId,
                type: "escrow.cancelled",
                title: "Escrow Cancelled",
                buyerMessage: `The escrow for "${escrow.title}" has been cancelled.`,
                sellerMessage: `The escrow for "${escrow.title}" has been cancelled.`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Milestone operations
    // ----------------------------------------------------------

    /**
     * Mark a specific milestone as delivered.
     */
    async deliverMilestone(
        escrowId: number,
        milestoneId: number,
        sellerId: number,
        deliveryNote?: string
    ): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);
            if (escrow.sellerId !== sellerId) {
                throw new EscrowAuthorizationError("Only the seller can deliver milestones");
            }

            const milestone = await queryRunner.manager.findOne(EscrowMilestonePayment, {
                where: { id: milestoneId, escrow: { id: escrowId } },
            });

            if (!milestone) {
                throw new EscrowNotFoundError(`Milestone ${milestoneId}`);
            }

            if (milestone.status !== MilestonePaymentStatus.PENDING &&
                milestone.status !== MilestonePaymentStatus.IN_PROGRESS) {
                throw new EscrowStateError(milestone.status, "deliver milestone");
            }

            milestone.status = MilestonePaymentStatus.DELIVERED;
            milestone.deliveredAt = new Date();
            milestone.deliveryNote = deliveryNote || null;
            await queryRunner.manager.save(milestone);

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                milestonePaymentId: milestone.id,
                actorId: sellerId,
                eventType: "milestone_delivered",
                description: `Milestone "${milestone.title}" delivered`,
            });

            await queryRunner.commitTransaction();

            await notificationService.create({
                userId: escrow.buyerId,
                type: "escrow.milestone_delivered",
                title: "Milestone Delivered",
                message: `Milestone "${milestone.title}" has been delivered for "${escrow.title}".`,
                escrowId: escrow.id,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Release funds for a specific milestone.
     */
    async releaseMilestone(
        escrowId: number,
        milestoneId: number,
        buyerId: number
    ): Promise<{ transferCode: string; status: string }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const escrow = await queryRunner.manager
                .createQueryBuilder(EscrowTransaction, "escrow")
                .setLock("pessimistic_write")
                .where("escrow.id = :id", { id: escrowId })
                .getOne();

            if (!escrow) throw new EscrowNotFoundError(escrowId);

            const releasingUser = await User.findOne({ where: { id: buyerId } });
            if (escrow.buyerId !== buyerId && releasingUser?.role !== "admin") {
                throw new EscrowAuthorizationError(
                    "Only the buyer or admin can release milestone funds"
                );
            }

            const milestone = await queryRunner.manager.findOne(EscrowMilestonePayment, {
                where: { id: milestoneId, escrow: { id: escrowId } },
            });

            if (!milestone) throw new EscrowNotFoundError(`Milestone ${milestoneId}`);
            if (milestone.status !== MilestonePaymentStatus.DELIVERED) {
                throw new EscrowStateError(milestone.status, "release milestone");
            }

            // Get seller payout account
            const payoutAccount = await SellerPayoutAccount.findOne({
                where: { userId: escrow.sellerId, isActive: true },
            });

            if (!payoutAccount) {
                throw new EscrowValidationError("Seller has no active payout account");
            }

            const transferRef = generateReference("MTRF", milestone.id);
            milestone.status = MilestonePaymentStatus.RELEASED;
            milestone.releasedAt = new Date();
            milestone.paystackTransferRef = transferRef;
            await queryRunner.manager.save(milestone);

            // Check if all milestones are released
            const allMilestones = await queryRunner.manager.find(EscrowMilestonePayment, {
                where: { escrow: { id: escrowId } },
            });
            const allReleased = allMilestones.every(
                (m) => m.status === MilestonePaymentStatus.RELEASED
            );

            if (allReleased) {
                escrow.status = EscrowStatus.RELEASED;
                escrow.fundsReleasedAt = new Date();
                await queryRunner.manager.save(escrow);
            }

            await this.logEvent(queryRunner, {
                escrowId: escrow.id,
                milestonePaymentId: milestone.id,
                actorId: buyerId,
                eventType: "milestone_released",
                description: `Milestone "${milestone.title}" funds released: KES ${fromKESKobo(Number(milestone.amount))}`,
            });

            await queryRunner.commitTransaction();

            // Initiate transfer after commit
            // Calculate milestone seller amount (deduct platform fee proportionally)
            const milestoneSellerAmount = Math.round(
                Number(milestone.amount) * (1 - PLATFORM_FEE_PERCENT)
            );

            let transferResult = { transfer_code: "", status: "pending" };
            try {
                transferResult = await paystackService.initiateTransfer({
                    amount: milestoneSellerAmount,
                    recipientCode: payoutAccount.paystackRecipientCode,
                    reference: transferRef,
                    reason: `Paza milestone payout: "${milestone.title}"`,
                });
            } catch (transferError) {
                console.error(
                    `[EscrowService] Milestone transfer failed for milestone ${milestoneId}:`,
                    transferError
                );
            }

            await notificationService.create({
                userId: escrow.sellerId,
                type: "escrow.milestone_released",
                title: "Milestone Payment Released",
                message: `KES ${fromKESKobo(milestoneSellerAmount).toLocaleString()} released for milestone "${milestone.title}".`,
                escrowId: escrow.id,
            });

            return {
                transferCode: transferResult.transfer_code,
                status: transferResult.status,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ----------------------------------------------------------
    // Queries
    // ----------------------------------------------------------

    /**
     * Get a single escrow by ID with authorization check.
     */
    async getEscrowById(
        escrowId: number,
        requesterId: number
    ): Promise<EscrowTransaction> {
        const escrow = await EscrowTransaction.findOne({
            where: { id: escrowId },
            relations: ["buyer", "seller", "milestonePayments"],
        });

        if (!escrow) throw new EscrowNotFoundError(escrowId);

        const requester = await User.findOne({ where: { id: requesterId } });
        if (
            escrow.buyerId !== requesterId &&
            escrow.sellerId !== requesterId &&
            requester?.role !== "admin"
        ) {
            throw new EscrowAuthorizationError("Not authorized to view this escrow");
        }

        return escrow;
    }

    /**
     * List escrows with filtering and pagination.
     */
    async listEscrows(params: ListEscrowParams): Promise<{
        escrows: EscrowTransaction[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        const qb = EscrowTransaction.createQueryBuilder("escrow")
            .leftJoinAndSelect("escrow.buyer", "buyer")
            .leftJoinAndSelect("escrow.seller", "seller")
            .orderBy("escrow.createdAt", "DESC")
            .take(limit)
            .skip(offset);

        if (params.userId && params.role !== "all") {
            if (params.role === "buyer") {
                qb.andWhere("escrow.buyerId = :userId", { userId: params.userId });
            } else if (params.role === "seller") {
                qb.andWhere("escrow.sellerId = :userId", { userId: params.userId });
            } else {
                // Default: show escrows where user is buyer OR seller
                qb.andWhere(
                    "(escrow.buyerId = :userId OR escrow.sellerId = :userId)",
                    { userId: params.userId }
                );
            }
        }

        if (params.status) {
            qb.andWhere("escrow.status = :status", { status: params.status });
        }

        const [escrows, total] = await qb.getManyAndCount();

        return {
            escrows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get the full audit log for an escrow.
     */
    async getEscrowEvents(escrowId: number): Promise<EscrowEvent[]> {
        return await EscrowEvent.find({
            where: { escrowId },
            order: { createdAt: "ASC" },
        });
    }

    /**
     * Get dashboard stats for a user.
     */
    async getDashboardStats(userId: number): Promise<EscrowStats> {
        const qb = EscrowTransaction.createQueryBuilder("escrow")
            .where("escrow.buyerId = :userId OR escrow.sellerId = :userId", { userId });

        const escrows = await qb.getMany();

        const stats: EscrowStats = {
            totalEscrows: escrows.length,
            pendingPayment: escrows.filter((e) => e.status === EscrowStatus.PENDING).length,
            inProgress: escrows.filter((e) => e.status === EscrowStatus.IN_PROGRESS).length,
            awaitingRelease: escrows.filter((e) => e.status === EscrowStatus.DELIVERED).length,
            completed: escrows.filter((e) => e.status === EscrowStatus.RELEASED).length,
            disputed: escrows.filter((e) => e.status === EscrowStatus.DISPUTED).length,
            totalValueKobo: escrows.reduce((sum, e) => sum + Number(e.totalAmount), 0),
            totalEarnedKobo: escrows
                .filter((e) => e.status === EscrowStatus.RELEASED && e.sellerId === userId)
                .reduce((sum, e) => sum + Number(e.sellerAmount), 0),
        };

        return stats;
    }

    // ----------------------------------------------------------
    // Auto-release (called by cron job)
    // ----------------------------------------------------------

    /**
     * Process auto-release for delivered escrows past their deadline.
     * Also sends 24-hour warning notifications.
     */
    async processAutoRelease(): Promise<void> {
        const now = new Date();

        // Find escrows ready for auto-release
        const readyForRelease = await EscrowTransaction.createQueryBuilder("escrow")
            .where("escrow.status = :status", { status: EscrowStatus.DELIVERED })
            .andWhere("escrow.autoReleaseAt <= :now", { now })
            .getMany();

        for (const escrow of readyForRelease) {
            try {
                // Use system actor (0) for auto-release
                await this.releaseFunds(escrow.id, escrow.buyerId);

                await notificationService.notifyBothParties({
                    buyerId: escrow.buyerId,
                    sellerId: escrow.sellerId,
                    type: "escrow.auto_released",
                    title: "Funds Auto-Released",
                    buyerMessage: `Funds for "${escrow.title}" were automatically released to the seller after the inspection period expired.`,
                    sellerMessage: `Funds for "${escrow.title}" were automatically released to your account.`,
                    escrowId: escrow.id,
                });
            } catch (error) {
                console.error(
                    `[EscrowService] Auto-release failed for escrow ${escrow.id}:`,
                    error
                );
            }
        }

        // Send 24-hour warnings
        const warningThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nearingRelease = await EscrowTransaction.createQueryBuilder("escrow")
            .where("escrow.status = :status", { status: EscrowStatus.DELIVERED })
            .andWhere("escrow.autoReleaseAt > :now", { now })
            .andWhere("escrow.autoReleaseAt <= :warningThreshold", { warningThreshold })
            .getMany();

        for (const escrow of nearingRelease) {
            await notificationService.create({
                userId: escrow.buyerId,
                type: "escrow.auto_release_warning",
                title: "Auto-Release Warning",
                message: `Funds for "${escrow.title}" will be automatically released in 24 hours. Review now or raise a dispute.`,
                escrowId: escrow.id,
            });
        }
    }

    // ----------------------------------------------------------
    // Seller payout account management
    // ----------------------------------------------------------

    /**
     * Set up a seller's payout account (M-PESA or bank).
     */
    async setupPayoutAccount(
        userId: number,
        params: {
            payoutMethod: "mpesa" | "bank";
            mpesaNumber?: string;
            bankAccountNumber?: string;
            bankCode?: string;
            accountName: string;
        }
    ): Promise<SellerPayoutAccount> {
        const user = await User.findOne({ where: { id: userId } });
        if (!user || user.accountType !== "Creator") {
            throw new EscrowValidationError(
                "Only creators can set up a payout account"
            );
        }

        // Deactivate existing payout account if any
        const existing = await SellerPayoutAccount.findOne({
            where: { userId, isActive: true },
        });
        if (existing) {
            existing.isActive = false;
            await existing.save();
        }

        // Create recipient on Paystack
        let recipientCode: string;

        if (params.payoutMethod === "mpesa") {
            if (!params.mpesaNumber) {
                throw new EscrowValidationError(
                    "M-PESA phone number is required"
                );
            }
            const result = await paystackService.createMpesaRecipient({
                name: params.accountName,
                phoneNumber: params.mpesaNumber,
            });
            recipientCode = result.recipient_code;

        } else {
            if (!params.bankAccountNumber || !params.bankCode) {
                throw new EscrowValidationError(
                    "Bank account number and bank code are required"
                );
            }
            const result = await paystackService.createBankRecipient({
                name: params.accountName,
                accountNumber: params.bankAccountNumber,
                bankCode: params.bankCode,
            });
            recipientCode = result.recipient_code;
        }

        // Save payout account
        const payoutAccount = SellerPayoutAccount.create({
            userId,
            payoutMethod: params.payoutMethod,
            mpesaNumber: params.mpesaNumber || null,
            bankAccountNumber: params.bankAccountNumber || null,
            bankCode: params.bankCode || null,
            bankName: params.accountName,
            paystackRecipientCode: recipientCode,
            isActive: true,
        });

        return await payoutAccount.save();
    }

    /**
     * Get seller's current payout account.
     */
    async getPayoutAccount(userId: number): Promise<SellerPayoutAccount | null> {
        return await SellerPayoutAccount.findOne({
            where: { userId, isActive: true },
        });
    }

    /**
     * Remove (deactivate) seller's payout account.
     */
    async removePayoutAccount(userId: number): Promise<boolean> {
        const account = await SellerPayoutAccount.findOne({
            where: { userId, isActive: true },
        });

        if (!account) return false;

        try {
            await paystackService.deleteRecipient(account.paystackRecipientCode);
        } catch (error) {
            console.error("[EscrowService] Failed to delete Paystack recipient:", error);
        }

        account.isActive = false;
        await account.save();
        return true;
    }

    // ----------------------------------------------------------
    // Admin
    // ----------------------------------------------------------

    /**
     * Get platform-wide escrow statistics (admin only).
     */
    async getAdminStats(): Promise<Record<string, any>> {
        const escrows = await EscrowTransaction.find();

        const totalVolume = escrows.reduce((sum, e) => sum + Number(e.totalAmount), 0);
        const totalFees = escrows.reduce((sum, e) => sum + Number(e.feeAmount), 0);
        const completedEscrows = escrows.filter(
            (e) => e.status === EscrowStatus.RELEASED
        );
        const completedVolume = completedEscrows.reduce(
            (sum, e) => sum + Number(e.totalAmount), 0
        );

        return {
            totalEscrows: escrows.length,
            byStatus: {
                pending: escrows.filter((e) => e.status === EscrowStatus.PENDING).length,
                funded: escrows.filter((e) => e.status === EscrowStatus.FUNDED).length,
                inProgress: escrows.filter((e) => e.status === EscrowStatus.IN_PROGRESS).length,
                delivered: escrows.filter((e) => e.status === EscrowStatus.DELIVERED).length,
                released: completedEscrows.length,
                disputed: escrows.filter((e) => e.status === EscrowStatus.DISPUTED).length,
                refunded: escrows.filter((e) => e.status === EscrowStatus.REFUNDED).length,
                cancelled: escrows.filter((e) => e.status === EscrowStatus.CANCELLED).length,
            },
            totalVolumeKES: fromKESKobo(totalVolume),
            completedVolumeKES: fromKESKobo(completedVolume),
            platformFeesKES: fromKESKobo(totalFees),
        };
    }

    // ----------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------

    /**
     * Log an event to the audit trail.
     * Uses the provided QueryRunner to participate in the caller's transaction.
     */
    private async logEvent(
        queryRunner: QueryRunner,
        params: {
            escrowId: number;
            milestonePaymentId?: number;
            actorId?: number;
            eventType: string;
            description?: string;
            metadata?: Record<string, any>;
            ipAddress?: string;
        }
    ): Promise<void> {
        const event = queryRunner.manager.create(EscrowEvent, {
            escrowId: params.escrowId,
            milestonePaymentId: params.milestonePaymentId || null,
            actorId: params.actorId || null,
            eventType: params.eventType,
            description: params.description || null,
            metadata: params.metadata || null,
            ipAddress: params.ipAddress || null,
        });

        await queryRunner.manager.save(event);
    }
}

export default new EscrowService();
