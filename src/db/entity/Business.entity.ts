import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BusinessMember } from "./BusinessMember.entity";

@Entity("businesses")
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  logoUrl: string;

  @OneToMany(() => BusinessMember, (member) => member.business)
  members: BusinessMember[];
}
