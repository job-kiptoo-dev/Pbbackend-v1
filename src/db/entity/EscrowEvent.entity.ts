/**
 * EscrowEvent Entity (Audit Log)
 *
 * Immutable log of every state change in the escrow lifecycle.
 * Rows are INSERT-only -- never update or delete.
 *
 * This provides a complete audit trail for compliance, dispute resolution,
 * and debugging. Each event captures who did what, when, and any
 * associated metadata (e.g. Paystack transaction details).
 *
 * Example events: "created", "funded", "work_started", "delivered",
 * "released", "dispute_raised", "dispute_resolved", "refunded", "cancelled"
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Index,
} from "typeorm";

@Entity("escrow_events")
@Index(["escrowId"])
@Index(["createdAt"])
export class EscrowEvent extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // The escrow transaction this event belongs to
    @Column()
    escrowId: number;

    // If this event relates to a specific milestone payment (optional)
    @Column({ type: "int", nullable: true })
    milestonePaymentId: number | null;

    // The user who triggered this event (null for system-generated events
    // like auto-release or webhook processing)
    @Column({ type: "int", nullable: true })
    actorId: number | null;

    // Machine-readable event type. Convention: snake_case.
    // Examples: "created", "funded", "work_started", "delivered",
    //           "released", "dispute_raised", "auto_released"
    @Column()
    eventType: string;

    // Human-readable description of what happened
    @Column({ type: "text", nullable: true })
    description: string | null;

    // Arbitrary JSON payload for event-specific data.
    // e.g. { paystackRef: "xxx", previousStatus: "funded", newStatus: "in_progress" }
    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any> | null;

    // IP address of the request that triggered this event (for fraud detection)
    @Column({ type: "varchar", nullable: true })
    ipAddress: string | null;

    // Immutable timestamp -- this is when the event was recorded
    @CreateDateColumn()
    createdAt: Date;
}
