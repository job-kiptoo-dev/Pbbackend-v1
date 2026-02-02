import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Campaign } from "./Campaign.entity";
import { Business } from "./Business.entity";

/**
 * Collaboration entity for managing campaign and business collaborations
 * Handles invitations, memberships, and role management for collaborations
 */
@Entity("collaborations")
export class CollaborationEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Collaboration type: Campaign, Business, Project, Referral
  @Column({
    type: "enum",
    enum: ["Campaign", "Business", "Project", "Referral"],
    default: "Campaign",
  })
  collaborationType: "Campaign" | "Business" | "Project" | "Referral";

  // Foreign key for the campaign (if collaboration is for a campaign)
  @ManyToOne(() => Campaign, { nullable: true, onDelete: "CASCADE" })
  campaign: Campaign | null;

  // Foreign key for the business (if collaboration is for a business)
  @ManyToOne(() => Business, { nullable: true, onDelete: "CASCADE" })
  business: Business | null;

  // The user who created/invited
  @ManyToOne(() => User, { nullable: false })
  inviter: User;

  // The user being invited (nullable if inviting by email)
  @ManyToOne(() => User, { nullable: true })
  invitee: User | null;

  // Email of invitee (used when user is not yet in system)
  @Column({ nullable: true })
  inviteeEmail: string;

  // Role in the collaboration
  @Column({
    type: "enum",
    enum: ["Owner", "Admin", "Lead", "Contributor", "Viewer"],
    default: "Contributor",
  })
  role: "Owner" | "Admin" | "Lead" | "Contributor" | "Viewer";

  // Status of the collaboration/invitation
  @Column({
    type: "enum",
    enum: ["Pending", "Accepted", "Rejected", "Active", "Inactive"],
    default: "Pending",
  })
  status: "Pending" | "Accepted" | "Rejected" | "Active" | "Inactive";

  // Optional message from inviter
  @Column({ type: "text", nullable: true })
  message: string | null;

  // Expiration date for pending invitations
  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;

  // When the invitation was accepted
  @Column({ type: "timestamp", nullable: true })
  acceptedAt: Date | null;

  // Unique identifier for tracking invitations
  @Column({ type: "varchar", unique: true, nullable: true })
  invitationToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
