import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Business } from "./Business.entity";

@Entity("business_members")
export class BusinessMember extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.businessMembers)
  user: User;

  @ManyToOne(() => Business, (business) => business.members)
  business: Business;

  @Column({
    type: "enum",
    enum: ["Admin", "Lead", "Member", "Community"],
    default: "Member",
  })
  role: "Admin" | "Lead" | "Member" | "Community";

  @Column({ default: false })
  isApproved: boolean;
}
