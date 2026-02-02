import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Campaign } from "./Campaign.entity";

@Entity("service_requests")
export class ServiceRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Campaign, { eager: true, onDelete: "CASCADE" })
  campaign: Campaign;

  @Column()
  campaign_id: number;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  postedBy: User;

  @Column()
  postedBy_id: number;

  @Column()
  serviceType: string; // e.g., "Videographer", "Editor", "Photographer", "Sound Designer"

  @Column({ type: "text" })
  description: string; // Detailed description of what's needed

  @Column({ type: "simple-array", nullable: true })
  skills: string[]; // Required skills (e.g., ["4K filming", "Color grading"])

  @Column({ type: "simple-array", nullable: true })
  tools: string[]; // Equipment/tools needed (e.g., ["4K camera", "Adobe Premiere"])

  @Column({ nullable: true })
  budget: string; // Budget or budget range

  @Column({ default: "Open" })
  status: "Open" | "In Progress" | "Completed" | "Closed";

  @Column({ type: "text", nullable: true })
  deliverables: string; // What the creator expects to get (e.g., "10 edited videos, 2K resolution")

  @Column({ nullable: true })
  deadline: Date; // When the service is needed

  @Column({ type: "integer", default: 0 })
  applications: number; // Count of applications/proposals

  @Column({ type: "simple-array", nullable: true })
  tags: string[]; // Tags for discoverability (e.g., ["short-form", "tiktok", "gaming"])

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
