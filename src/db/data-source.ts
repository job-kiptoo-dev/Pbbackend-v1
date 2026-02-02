import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { SocialVerification } from "./entity/SocialVerification";
import { Business } from "./entity/Business.entity";
import { BusinessMember } from "./entity/BusinessMember.entity";
import { CreatorProfile } from "./entity/CreatorProfile.entity";
import {
  Campaign,
  CampaignMilestone,
  CampaignTeam,
  CampaignFeedback,
  CampaignTeamMember,
} from "./entity/Campaign.entity";
import { CollaborationEntity } from "./entity/Collaboration.entity";
import { Job, JobProposal } from "./entity/Job.entity";
import { BrandProfile } from "./entity/BrandProfile.entity";
import { ServiceRequest } from "./entity/ServiceRequest.entity";
import dotenv from "dotenv";

dotenv.config();

// const isRender = !!process.env.RENDER;

const AppDataSource = new DataSource({

 type: "postgres",

  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "paza_db",

  // ssl: isRender
  //   ? { rejectUnauthorized: false }
  //   : false,
  //
  entities: [
    User,
    SocialVerification,
    Business,
    BusinessMember,
    CreatorProfile,
    Campaign,
    CampaignMilestone,
    CampaignTeam,
    CampaignFeedback,
    CampaignTeamMember,
    CollaborationEntity,
    Job,
    JobProposal,
    BrandProfile,
    ServiceRequest,
  ],

  synchronize: true,
});

export default AppDataSource;
