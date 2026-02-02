import {
  BaseEntity,
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("creator_profiles")
export class CreatorProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.creatorProfile)
  @JoinColumn()
  user: User;

  // Basic info step
  @Column({ nullable: true })
  creatorname: string;

  @Column({ type: "text", nullable: true })
  about: string;

  @Column({ nullable: true })
  main: string;

  // Social media step
  @Column({ nullable: true })
  followers: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  tiktok: string;

  @Column({ nullable: true })
  twitter: string;

  @Column({ nullable: true })
  youtube: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  social: string;

  // Experience step
  @Column({ type: "text", nullable: true })
  experience: string;

  @Column({ type: "text", nullable: true })
  milestones: string;

  @Column({ type: "text", nullable: true })
  collabs: string;

  // Categories & values step
  @Column({ nullable: true })
  category: string;

  @Column({ type: "simple-array", nullable: true })
  subCategory: string[];

  @Column({ nullable: true })
  corevalue: string;

  @Column({ type: "simple-array", nullable: true })
  coreValues: string[];

  @Column({ type: "simple-array", nullable: true })
  subCoreValues: string[];

  @Column({ type: "simple-array", nullable: true })
  topics: string[];

  // Profile media step
  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  preview: string;

  // Legacy fields (kept for backward compatibility)
  @Column({ nullable: true })
  profileUrl: string;

  @Column({ nullable: true })
  audienceType: string;

  @Column({ nullable: true })
  preferredFormat: string;

  @Column({ nullable: true })
  collaborationPreference: string;

  @Column({ nullable: true })
  industryPreference: string;

  @Column({ nullable: true })
  community: string;

  @Column({ nullable: true })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
