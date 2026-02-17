/**
 * Notification Service
 *
 * Handles creation and retrieval of in-app notifications for users.
 * Notifications are created as side-effects of escrow lifecycle events
 * (e.g. escrow funded, work delivered, dispute raised).
 *
 * Design decisions:
 *   - Notifications are fire-and-forget: creation failures are logged
 *     but never block the main escrow operation.
 *   - Email/SMS integration is out of scope for Phase 1.
 *   - Each notification stores the escrowId for deep-linking in the frontend.
 */

import { Notification } from "../db/entity/Notification.entity";

// ============================================================
// Types
// ============================================================

export interface CreateNotificationParams {
    userId: number;
    type: string;           // e.g. "escrow.created", "payment.confirmed", "payout.confirmed"
    title: string;
    message: string;
    escrowId?: number;
    metadata?: Record<string, any>;
}

// ============================================================
// Service
// ============================================================

class NotificationService {
    /**
     * Create a notification for a user.
     *
     * This method never throws -- errors are caught and logged.
     * Escrow operations must not fail because of a notification issue.
     */
    async create(params: CreateNotificationParams): Promise<Notification | null> {
        try {
            const notification = Notification.create({
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                escrowId: params.escrowId || null,
                metadata: params.metadata || null,
                isRead: false,
            });

            return await notification.save();
        } catch (error) {
            console.error("[NotificationService] Failed to create notification:", error);
            return null;
        }
    }

    /**
     * Notify both parties of an escrow about an event.
     * Convenience method that creates two notifications at once.
     */
    async notifyBothParties(params: {
        buyerId: number;
        sellerId: number;
        type: string;
        title: string;
        buyerMessage: string;
        sellerMessage: string;
        escrowId: number;
        metadata?: Record<string, any>;
    }): Promise<void> {
        await Promise.all([
            this.create({
                userId: params.buyerId,
                type: params.type,
                title: params.title,
                message: params.buyerMessage,
                escrowId: params.escrowId,
                metadata: params.metadata,
            }),
            this.create({
                userId: params.sellerId,
                type: params.type,
                title: params.title,
                message: params.sellerMessage,
                escrowId: params.escrowId,
                metadata: params.metadata,
            }),
        ]);
    }

    /**
     * Get notifications for a user with optional filtering.
     */
    async getByUserId(
        userId: number,
        options?: { unreadOnly?: boolean; limit?: number; offset?: number }
    ): Promise<{ notifications: Notification[]; total: number }> {
        const where: Record<string, any> = { userId };

        if (options?.unreadOnly) {
            where.isRead = false;
        }

        const [notifications, total] = await Notification.findAndCount({
            where,
            order: { createdAt: "DESC" },
            take: options?.limit || 20,
            skip: options?.offset || 0,
        });

        return { notifications, total };
    }

    /**
     * Mark a single notification as read.
     */
    async markAsRead(notificationId: number, userId: number): Promise<boolean> {
        const notification = await Notification.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            return false;
        }

        notification.isRead = true;
        await notification.save();
        return true;
    }

    /**
     * Mark all notifications as read for a user.
     */
    async markAllAsRead(userId: number): Promise<number> {
        const result = await Notification.update(
            { userId, isRead: false },
            { isRead: true }
        );

        return result.affected || 0;
    }

    /**
     * Get unread notification count for a user.
     * Useful for the notification badge in the frontend.
     */
    async getUnreadCount(userId: number): Promise<number> {
        return await Notification.count({
            where: { userId, isRead: false },
        });
    }
}

export default new NotificationService();
