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

// Declare Campaign first to avoid circular reference at runtime
@Entity("campaigns")
export class Campaign extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "simple-array", nullable: true })
  goals: string[];

  @Column({ type: "decimal", default: 0 })
  budget: number;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  createdby: string;

  @Column({ nullable: true })
  cocampaign: string;

  @Column({ nullable: true })
  jobId: string;

  @OneToMany(() => CampaignMilestone, (milestone) => milestone.campaign, {
    cascade: true,
    eager: true,
  })
  milestones: CampaignMilestone[];

  @OneToMany(() => CampaignTeam, (team) => team.campaign, {
    cascade: true,
    eager: true,
  })
  teams: CampaignTeam[];

  @OneToMany(() => CampaignFeedback, (feedback) => feedback.campaign, {
    cascade: true,
    eager: true,
  })
  feedback: CampaignFeedback[];

  @ManyToOne(() => User, { nullable: true })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("campaign_milestones")
export class CampaignMilestone extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "simple-array", nullable: true })
  objectives: string[];

  @Column({
    type: "enum",
    enum: ["Major Milestone", "Minor Milestone"],
    nullable: true,
  })
  category: "Major Milestone" | "Minor Milestone";

  @Column({ type: "date", nullable: true })
  start: Date;

  @Column({ type: "date", nullable: true })
  end: Date;

  @Column({
    type: "enum",
    enum: ["In Progress", "Completed"],
    default: "In Progress",
  })
  status: "In Progress" | "Completed";

  @Column({ type: "decimal", nullable: true })
  budget: number;

  @ManyToOne(() => Campaign, (campaign) => campaign.milestones, {
    onDelete: "CASCADE",
  })
  campaign: Campaign;
}

@Entity("campaign_teams")
export class CampaignTeam extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => CampaignTeamMember, (member) => member.team, {
    cascade: true,
    eager: true,
  })
  members: CampaignTeamMember[];

  @ManyToOne(() => Campaign, (campaign) => campaign.teams, {
    onDelete: "CASCADE",
  })
  campaign: Campaign;
}

@Entity("campaign_team_members")
export class CampaignTeamMember extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @ManyToOne(() => CampaignTeam, (team) => team.members, {
    onDelete: "CASCADE",
  })
  team: CampaignTeam;
}

@Entity("campaign_feedback")
export class CampaignFeedback extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: "text" })
  feedback: string;

  @Column({ type: "text", nullable: true })
  desc: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.feedback, {
    onDelete: "CASCADE",
  })
  campaign: Campaign;
}
