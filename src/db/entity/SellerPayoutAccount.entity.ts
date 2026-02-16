/**
 * SellerPayoutAccount Entity
 *
 * Stores a creator's (seller's) payout configuration for receiving
 * escrow payments. Each seller has at most one active payout account.
 *
 * Supported payout methods:
 *   - M-PESA: Kenya's mobile money (most common for creators)
 *   - Bank: Direct bank transfer via Paystack
 *
 * The paystackRecipientCode (e.g. "RCP_xxxxxxxx") is the Paystack
 * Transfer Recipient that represents this payout destination. It is
 * created via Paystack's "Create Transfer Recipient" API when the
 * seller sets up their payout account.
 *
 * IMPORTANT: When releasing escrow funds, the recipientCode is
 * snapshotted onto the EscrowTransaction record. This protects against
 * the seller changing their payout details mid-escrow.
 */

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("seller_payout_accounts")
export class SellerPayoutAccount extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // One payout account per user (seller). The user must have
    // accountType === "Creator" to set up a payout account.
    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({ unique: true })
    userId: number;

    // Payout method chosen by the seller
    @Column({ type: "enum", enum: ["mpesa", "bank"] })
    payoutMethod: "mpesa" | "bank";

    // -- M-PESA fields (populated when payoutMethod === "mpesa") --
    // Phone number in local format: e.g. "0712345678"
    @Column({ type: "varchar", nullable: true })
    mpesaNumber: string | null;

    // -- Bank fields (populated when payoutMethod === "bank") --
    @Column({ type: "varchar", nullable: true })
    bankAccountNumber: string | null;

    // Paystack bank code (e.g. "033" for UBA). Retrieved from Paystack
    // "List Banks" API filtered for Kenya.
    @Column({ type: "varchar", nullable: true })
    bankCode: string | null;

    // Resolved account name from Paystack's "Resolve Account Number" API.
    // Stored for display and verification purposes.
    @Column({ type: "varchar", nullable: true })
    bankName: string | null;

    // Paystack Transfer Recipient code (e.g. "RCP_xxxxxxxx").
    // This is the handle used when initiating transfers to this seller.
    @Column()
    paystackRecipientCode: string;

    // Soft-delete flag. When false, the account is not used for payouts
    // but the record is retained for audit purposes.
    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
