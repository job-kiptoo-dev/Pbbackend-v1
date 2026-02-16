/**
 * WebhookLog Entity
 *
 * Stores incoming webhook payloads for idempotency and debugging.
 * The unique constraint on (provider, eventType, reference) prevents
 * the same webhook event from being processed twice.
 *
 * NOTE: This entity is created in Phase 1 but the webhook handler
 * that populates it is deferred to Phase 2. The entity and its
 * constraints must exist now so that Phase 2 can be added without
 * schema migrations.
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
    Index,
} from "typeorm";

@Entity("webhook_logs")
@Unique(["provider", "eventType", "reference"])
@Index(["provider", "processed"])
export class WebhookLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // Payment provider identifier (e.g. "paystack")
    @Column({ default: "paystack" })
    provider: string;

    // Paystack event type (e.g. "charge.success", "transfer.success")
    @Column()
    eventType: string;

    // Unique reference from the provider (e.g. Paystack transaction reference).
    // Combined with provider + eventType forms the idempotency key.
    @Column({ nullable: true })
    reference: string | null;

    // Full raw webhook payload stored for debugging and replay
    @Column({ type: "jsonb" })
    payload: Record<string, any>;

    // Whether this webhook has been successfully processed.
    // Set to true after the handler completes without error.
    @Column({ default: false })
    processed: boolean;

    // If processing failed, the error message is stored here
    // for manual review and retry.
    @Column({ type: "text", nullable: true })
    error: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
