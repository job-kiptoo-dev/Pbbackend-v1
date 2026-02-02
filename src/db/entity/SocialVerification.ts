import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity('social_verifications')
export class SocialVerification extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.socialVerifications)
    user: User;

    @Column()
    platform: string;

    @Column({default:false})
    isVerified: boolean;

    @Column({nullable:true})
    verifiedAt: Date;
    
    @Column({type: 'json', nullable: true})
    platformData: object;
}
