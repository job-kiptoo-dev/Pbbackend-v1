/**
 * Notification Entity
 *
 * In-app notification records for escrow lifecycle events.
 * Notifications are created by the NotificationService and displayed
 * to users in the frontend notification center.
 *
 * Email/SMS delivery is out of scope for Phase 1 -- this entity
 * stores the notification content for in-app display only.
 *
 * The type field uses a dot-notation convention for categorization:
 *   "escrow.created", "escrow.funded", "escrow.delivered", etc.
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Index,
} from "typeorm";
import { User } from "./User";

@Entity("notifications")
@Index(["userId", "isRead"])
@Index(["createdAt"])
export class Notification extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // The user who should see this notification
    @ManyToOne(() => User, { nullable: false })
    user: User;

    @Column()
    userId: number;

    // Notification type for frontend categorization and filtering.
    // Convention: "escrow.created", "escrow.funded", "dispute.raised", etc.
    @Column()
    type: string;

    // Short title shown in the notification list
    @Column()
    title: string;

    // Full notification message body
    @Column({ type: "text" })
    message: string;

    // Whether the user has read this notification
    @Column({ default: false })
    isRead: boolean;

    // Optional reference to the related escrow transaction.
    // Allows the frontend to link the notification to the escrow detail page.
    @Column({ nullable: true })
    escrowId: number | null;

    // Arbitrary metadata for frontend rendering (e.g. amount, party names)
    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn()
    createdAt: Date;
}
