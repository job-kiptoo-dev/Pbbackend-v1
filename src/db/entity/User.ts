import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SocialVerification } from "./SocialVerification";
import { BusinessMember } from "./BusinessMember.entity";
import { CreatorProfile } from "./CreatorProfile.entity";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  birthday: Date ;

  @Column({ nullable: true, type: "enum", enum: ["Male", "Female", "Other"] })
  gender: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({
    type: "enum",
    enum: ["Individual", "Business", "Creator", "None"],
    default: "None",
  })
  accountType: "Individual" | "Business" | "Creator" | "None";

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ nullable: true, type: "timestamp" })
  verificationTokenExpiry: Date | null;

  @Column({ nullable: true, type: "varchar" })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: "timestamp" })
  resetPasswordExpiry: Date | null;

  // YouTube verification fields
  @OneToMany(
    () => SocialVerification,
    (socialVerification) => socialVerification.user
  )
  socialVerifications: SocialVerification[];

  @OneToMany(() => BusinessMember, (businessMember) => businessMember.user)
  businessMembers: BusinessMember[];

  @OneToOne(() => CreatorProfile, (creatorProfile) => creatorProfile.user)
  creatorProfile: CreatorProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
