import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn, // ADDED: Import JoinColumn
} from "typeorm";
import { User } from "./User";
import { Business } from "./Business.entity";

// Define enums for type safety
export enum JobVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  INVITE_ONLY = "invite_only",
}

export enum JobPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum ProposalStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("jobs")
@Index(["category", "isActive"]) // Composite index for filtering
@Index(["owner_id", "isActive"]) // Index for owner queries
@Index(["createdAt"]) // Index for sorting by date
export class Job extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index() // Index for search
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  availability: string;

  @Column({ nullable: true })
  @Index() // Index for location filtering
  location: string;

  @Column({ nullable: true })
  @Index() // Index for category filtering
  category: string;

  @Column({ nullable: true })
  age: string;

  @Column({ nullable: true })
  experience: string;

  @Column({
    type: "enum",
    enum: JobPriority,
    nullable: true,
  })
  priority: JobPriority;

  @Column({
    type: "enum",
    enum: JobVisibility,
    default: JobVisibility.PUBLIC,
  })
  visibility: JobVisibility;

  @Column({ nullable: true })
  payment: string;

  @Column({ type: "text", nullable: true })
  paymentdesc: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  years: string;

  // Changed to json for better querying
  @Column({ type: "jsonb", nullable: true })
  goals: string[];

  @Column({ type: "jsonb", nullable: true })
  skills: string[];

  @Column({ type: "jsonb", nullable: true })
  contents: string[];

  @Column({ type: "jsonb", nullable: true })
  platforms: string[];

  // FIXED: Added JoinColumn to specify the foreign key column name
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @Column()
  @Index() // Index for owner queries
  owner_id: number;

  // FIXED: Added JoinColumn to specify the foreign key column name
  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: "business_id" })
  business: Business | null;

  @Column({ type: "int", nullable: true })
  business_id: number | null;

  @OneToMany(() => JobProposal, (proposal) => proposal.job, {
    cascade: true,
  })
  proposals: JobProposal[];

  @Column({ default: true })
  @Index() // Index for active job queries
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("job_proposals")
@Index(["job", "proposer_id"]) // Composite index to check existing proposals
@Index(["proposer_id", "status"]) // Index for user's proposals
export class JobProposal extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  proposedBudget: string;

  @Column({ type: "jsonb", nullable: true })
  deliverables: string[];

  // FIXED: Added JoinColumn
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "proposer_id" })
  proposer: User;

  @Column()
  @Index()
  proposer_id: number;

  @ManyToOne(() => Job, (job) => job.proposals, { onDelete: "CASCADE" })
  job: Job;

  @Column({
    type: "enum",
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  @Index() // Index for status filtering
  status: ProposalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
