/**
 * EscrowTransaction Entity
 *
 * Core escrow record for the Paza platform. One escrow is created per
 * accepted Job proposal, activated Campaign, or hired ServiceRequest.
 *
 * Financial flow:
 *   1. Buyer pays totalAmount into Paystack (held in platform balance)
 *   2. Platform deducts feeAmount (2% commission)
 *   3. sellerAmount (totalAmount - feeAmount) is transferred to seller on release
 *
 * All monetary values are stored in KES kobo (cents):
 *   1 KES = 100 kobo. e.g. KES 5,000 = 500000 kobo.
 *
 * Status lifecycle: pending -> funded -> in_progress -> delivered -> released
 *   (with branches for disputed, refunded, cancelled)
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

// -- Escrow status enum --
// Each status represents a distinct phase of the escrow lifecycle.
export enum EscrowStatus {
    PENDING = "pending",           // Created, awaiting buyer payment
    FUNDED = "funded",             // Buyer has paid; funds held in Paystack
    IN_PROGRESS = "in_progress",   // Seller has started working
    DELIVERED = "delivered",       // Seller marked work as delivered
    RELEASED = "released",         // Funds transferred to seller
    DISPUTED = "disputed",        // One party raised a dispute
    REFUNDED = "refunded",        // Funds returned to buyer
    CANCELLED = "cancelled",      // Escrow cancelled before funding
}

// -- Dispute resolution outcomes --
export enum DisputeResolution {
    RELEASE_TO_SELLER = "release_to_seller",
    REFUND_BUYER = "refund_buyer",
    PARTIAL_SPLIT = "partial_split",
}

// -- Payout method for seller --
export enum PayoutMethod {
    MPESA = "mpesa",
    BANK = "bank",
}

@Entity("escrow_transactions")
@Index(["buyerId"])
@Index(["sellerId"])
@Index(["status"])
@Index(["paystackPaymentRef"], { unique: true, where: '"paystackPaymentRef" IS NOT NULL' })
export class EscrowTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // -- Parties --
    // The buyer is the user who pays (Individual or Business account type).
    @ManyToOne(() => User, { nullable: false, eager: true })
    buyer: User;

    @Column()
    buyerId: number;

    // The seller is the creator who receives payment for completed work.
    @ManyToOne(() => User, { nullable: false, eager: true })
    seller: User;

    @Column()
    sellerId: number;

    // -- Source link --
    // Exactly one of these groups will be populated, depending on how the
    // escrow was triggered. We use nullable columns instead of a polymorphic
    // relation for simplicity and query performance.
    @Column({ type: "int", nullable: true })
    @Index()
    jobId: number | null;

    @Column({ type: "int", nullable: true })
    jobProposalId: number | null;

    @Column({ type: "int", nullable: true })
    @Index()
    campaignId: number | null;

    @Column({ type: "int", nullable: true })
    serviceRequestId: number | null;

    @Column({ type: "int", nullable: true })
    campaignMilestoneId: number | null;

    // -- Amounts (all in KES kobo / cents) --
    // totalAmount: full amount the buyer pays
    @Column({ type: "bigint" })
    totalAmount: number;

    // feeAmount: platform commission (default 2%)
    @Column({ type: "bigint", default: 0 })
    feeAmount: number;

    // sellerAmount: what the seller receives (totalAmount - feeAmount)
    @Column({ type: "bigint", default: 0 })
    sellerAmount: number;

    @Column({ default: "KES" })
    currency: string;

    // -- Status --
    @Column({
        type: "enum",
        enum: EscrowStatus,
        default: EscrowStatus.PENDING,
    })
    status: EscrowStatus;

    // -- Paystack references --
    // paystackPaymentRef: unique reference for the buyer's payment transaction
    @Column({ nullable: true })
    paystackPaymentRef: string | null;

    // paystackAccessCode: Paystack checkout session code (used for hosted page)
    @Column({ nullable: true })
    paystackAccessCode: string | null;

    // paystackTransferRef: reference for the seller payout transfer
    @Column({ nullable: true })
    paystackTransferRef: string | null;

    // -- Seller payout snapshot --
    // Captured at the moment of release to protect against seller changing
    // payout details mid-escrow.
    @Column({ nullable: true })
    sellerRecipientCode: string | null;

    @Column({ nullable: true, type: "enum", enum: PayoutMethod })
    sellerPayoutMethod: PayoutMethod | null;

    // -- Delivery and release --
    @Column({ type: "text", nullable: true })
    deliveryNote: string | null;

    @Column({ type: "timestamp", nullable: true })
    deliveryConfirmedAt: Date | null;

    // autoReleaseAt: if buyer does not act within this deadline, funds
    // are automatically released to the seller.
    @Column({ type: "timestamp", nullable: true })
    autoReleaseAt: Date | null;

    @Column({ type: "timestamp", nullable: true })
    fundsReleasedAt: Date | null;

    // inspectionPeriodDays: how many days the buyer has to review after
    // delivery before auto-release kicks in. Defaults to 7.
    @Column({ type: "int", default: 7 })
    inspectionPeriodDays: number;

    // -- Dispute fields --
    @Column({ type: "text", nullable: true })
    disputeReason: string | null;

    // userId of the party who raised the dispute
    @Column({ type: "int", nullable: true })
    disputeRaisedBy: number | null;

    @Column({ type: "timestamp", nullable: true })
    disputeResolvedAt: Date | null;

    @Column({ nullable: true, type: "enum", enum: DisputeResolution })
    disputeResolution: DisputeResolution | null;

    @Column({ type: "text", nullable: true })
    disputeNotes: string | null;

    // In a partial_split resolution, this is the seller's percentage (0-100).
    @Column({ type: "int", nullable: true })
    splitPercent: number | null;

    // -- Cancellation --
    @Column({ type: "int", nullable: true })
    cancelledBy: number | null;

    @Column({ type: "text", nullable: true })
    cancellationReason: string | null;

    @Column({ type: "timestamp", nullable: true })
    cancelledAt: Date | null;

    // -- Milestone payments (for campaign-based escrows) --
    // Lazy-loaded; only populated for campaign escrows with milestones.
    @OneToMany(
        () => require("./EscrowMilestonePayment.entity").EscrowMilestonePayment,
        (milestone: any) => milestone.escrow,
        { cascade: true }
    )
    milestonePayments: any[];

    // -- Descriptive metadata --
    // title: snapshot of the job/campaign title at creation time
    @Column({ nullable: true })
    title: string | null;

    @Column({ type: "text", nullable: true })
    terms: string | null;

    // metadata: arbitrary JSON for extensibility (e.g. original proposal details)
    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
