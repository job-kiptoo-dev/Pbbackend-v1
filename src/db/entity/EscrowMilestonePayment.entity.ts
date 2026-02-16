/**
 * EscrowMilestonePayment Entity
 *
 * Tracks individual milestone payments within a campaign-based escrow.
 * Each row maps to an existing CampaignMilestone by ID (loose coupling --
 * no foreign key constraint, just a reference).
 *
 * For a campaign with 3 milestones, the parent EscrowTransaction holds the
 * total, and 3 EscrowMilestonePayment rows hold the per-milestone breakdown.
 * Each milestone can be independently delivered, released, or disputed.
 *
 * Amounts are in KES kobo (cents).
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { EscrowTransaction } from "./EscrowTransaction.entity";

// -- Milestone payment status --
// Mirrors the parent escrow statuses but scoped to a single milestone.
export enum MilestonePaymentStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    DELIVERED = "delivered",
    RELEASED = "released",
    DISPUTED = "disputed",
    REFUNDED = "refunded",
}

@Entity("escrow_milestone_payments")
@Index(["escrow"])
export class EscrowMilestonePayment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // Parent escrow transaction
    @ManyToOne(() => EscrowTransaction, (escrow) => escrow.milestonePayments, {
        onDelete: "CASCADE",
    })
    escrow: EscrowTransaction;

    // Reference to the CampaignMilestone this payment corresponds to.
    // Stored as a plain integer (no FK) so the escrow system stays
    // loosely coupled from the campaign module.
    @Column()
    campaignMilestoneId: number;

    // Snapshot of the milestone title at the time of escrow creation.
    // Prevents confusion if the original milestone title is later edited.
    @Column()
    title: string;

    // Amount allocated to this milestone (KES kobo)
    @Column({ type: "bigint" })
    amount: number;

    // Display order (0-based). Milestones are typically completed sequentially,
    // though the system does not enforce strict ordering.
    @Column({ type: "int", default: 0 })
    orderIndex: number;

    @Column({
        type: "enum",
        enum: MilestonePaymentStatus,
        default: MilestonePaymentStatus.PENDING,
    })
    status: MilestonePaymentStatus;

    @Column({ type: "timestamp", nullable: true })
    dueDate: Date | null;

    @Column({ type: "timestamp", nullable: true })
    deliveredAt: Date | null;

    @Column({ type: "timestamp", nullable: true })
    releasedAt: Date | null;

    // Seller's note describing what was delivered for this milestone
    @Column({ type: "text", nullable: true })
    deliveryNote: string | null;

    // If buyer rejects the milestone delivery, they provide a reason
    @Column({ type: "text", nullable: true })
    rejectionReason: string | null;

    // Paystack transfer reference for this specific milestone payout
    @Column({ nullable: true })
    paystackTransferRef: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
