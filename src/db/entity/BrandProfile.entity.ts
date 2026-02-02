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
import { Business } from "./Business.entity";

@Entity("brand_profiles")
export class BrandProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Business, { eager: false })
  @JoinColumn()
  business: Business;

  // Basic info step
  @Column({ nullable: true })
  brandname: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  industry: string;

  // Contact step
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  // Company step
  @Column({ nullable: true })
  foundedYear: string;

  @Column({ nullable: true })
  employees: string;

  @Column({ type: "text", nullable: true })
  mission: string;

  @Column({ type: "simple-array", nullable: true })
  values: string[];

  // Social media step
  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  twitter: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  youtube: string;

  @Column({ nullable: true })
  tiktok: string;

  // Media step
  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  // Details step
  @Column({ type: "simple-array", nullable: true })
  partnerships: string[];

  @Column({ type: "simple-array", nullable: true })
  awards: string[];

  @Column({ type: "text", nullable: true })
  testimonials: string;

  @Column({ type: "simple-array", nullable: true })
  categories: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
