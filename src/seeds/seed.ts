import dotenv from "dotenv";
dotenv.config();

import AppDataSource from "../db/data-source";
import bcrypt from "bcrypt";
import { generateVerificationToken } from "../utils/token.utils";

import { User } from "../db/entity/User";
import { CreatorProfile } from "../db/entity/CreatorProfile.entity";
import { Job, JobProposal } from "../db/entity/Job.entity";
import { Campaign } from "../db/entity/Campaign.entity";
import { CollaborationEntity } from "../db/entity/Collaboration.entity";

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Data source initialized for seeding");

    // Clear minimal data (be careful in production) - optional
    // await AppDataSource.manager.clear(Job);

    // Create a regular user
    const passwordHash = await bcrypt.hash("Password123!", 10);

    let user1 = await User.findOne({ where: { email: "alice@example.com" } });
    if (user1) {
      console.log("Seeding: user1 already exists ->", user1.id);
    } else {
      user1 = new User();
      user1.email = "alice@example.com";
      user1.password = passwordHash;
      user1.firstName = "Alice";
      user1.lastName = "Anderson";
      user1.isVerified = true;
      user1.accountType = "Individual" as any;
      console.log("Seeding: saving user1...");
      await user1.save();
      console.log("Seeding: saved user1 ->", user1.id);
    }

    // Create a creator user
    let creator = await User.findOne({ where: { email: "creator@example.com" } });
    if (creator) {
      console.log("Seeding: creator already exists ->", creator.id);
    } else {
      creator = new User();
      creator.email = "creator@example.com";
      creator.password = passwordHash;
      creator.firstName = "Cara";
      creator.lastName = "Creator";
      creator.isVerified = true;
      creator.accountType = "Creator" as any;
      console.log("Seeding: saving creator user...");
      await creator.save();
      console.log("Seeding: saved creator ->", creator.id);
    }

    // Create CreatorProfile
    let profile = await CreatorProfile.findOne({ where: { user: { id: creator.id } } });
    if (profile) {
      console.log("Seeding: CreatorProfile already exists ->", profile.id);
    } else {
      profile = new CreatorProfile();
      profile.user = creator;
      profile.profileUrl = "https://example.com/cara";
      profile.experience = "3 years";
      profile.audienceType = "Tech";
      profile.preferredFormat = "Video";
      profile.collaborationPreference = "Paid collaborations";
      profile.industryPreference = "Technology";
      profile.community = "Tech Creators";
      profile.rating = 4;
      console.log("Seeding: saving creator profile...");
      await profile.save();
      console.log("Seeding: saved profile ->", profile.id);
    }

    // Create a sample campaign
    let campaign = await Campaign.findOne({ where: { title: "Seed Campaign", createdby: creator.email } });
    if (campaign) {
      console.log("Seeding: Campaign already exists ->", campaign.id);
    } else {
      campaign = new Campaign();
      campaign.title = "Seed Campaign";
      campaign.description = "Campaign created by seed script";
      campaign.goals = ["reach users", "test seed"];
      campaign.budget = 1000 as any;
      campaign.createdby = creator.email;
      campaign.cocampaign = null as any;
      campaign.jobId = null as any;
      campaign.active = true;
      campaign.milestones = [] as any;
      campaign.teams = [] as any;
      campaign.feedback = [] as any;
      console.log("Seeding: saving campaign...");
      await campaign.save();
      console.log("Seeding: saved campaign ->", campaign.id);
    }

    // Create a sample job owned by creator
    let job = await Job.findOne({ where: { title: "Seed: Social Media Content Creator", owner: { id: creator.id } } });
    if (job) {
      console.log("Seeding: Job already exists ->", job.id);
    } else {
      job = Job.create({
        title: "Seed: Social Media Content Creator",
        description: "Create sample short-form videos for campaign",
        gender: "Any",
        availability: "Part-time",
        location: "Remote",
        category: "Content Creation",
        age: "18+",
        experience: "2+ years",
        priority: "high" as any,
        visibility: "public" as any,
        payment: "5000",
        paymentdesc: "per project",
        link: "https://example.com/job",
        years: "2",
        goals: ["Create 10 videos"],
        skills: ["Video Editing", "Storytelling"],
        contents: ["TikTok", "Reels"],
        platforms: ["TikTok", "Instagram"],
        owner: creator,
        owner_id: creator.id,
        proposals: [],
        isActive: true,
      });

      console.log("Seeding: saving job...");
      await job.save();
      console.log("Seeding: saved job ->", job.id);
    }

    // Create a proposal from user1
    let proposal = await JobProposal.findOne({ where: { job: { id: job.id }, proposer: { id: user1.id } } });
    if (proposal) {
      console.log("Seeding: Proposal already exists ->", proposal.id);
    } else {
      proposal = JobProposal.create({
        title: "I can deliver high-quality videos",
        description: "Experienced creator ready to start",
        proposedBudget: "4500",
        deliverables: ["10 TikTok videos", "Thumbnails"],
        job,
        proposer: user1,
        proposer_id: user1.id,
        status: "pending" as any,
      });

      console.log("Seeding: saving proposal...");
      await proposal.save();
      console.log("Seeding: saved proposal ->", proposal.id);
    }

    // Add a collaboration invite from creator to user1
    let collab = await CollaborationEntity.findOne({ where: { campaign: { id: campaign.id }, invitee: { id: user1.id } } });
    if (collab) {
      console.log("Seeding: Collaboration already exists ->", collab.id);
    } else {
      collab = new CollaborationEntity();
      collab.collaborationType = "Campaign";
      collab.campaign = campaign;
      collab.business = null as any;
      collab.inviter = creator;
      collab.invitee = user1;
      collab.inviteeEmail = user1.email;
      collab.role = "Contributor" as any;
      collab.status = "Accepted" as any;
      collab.message = "Welcome to the campaign";
      collab.expiresAt = null as any;
      collab.acceptedAt = new Date();
      collab.invitationToken = generateVerificationToken();

      console.log("Seeding: saving collaboration...");
      await collab.save();
      console.log("Seeding: saved collaboration ->", collab.id);
    }

    console.log("Seeding complete:");
    console.log(" - user:", user1.email);
    console.log(" - creator:", creator.email);
    console.log(" - profile:", profile.profileUrl);
    console.log(" - campaign:", campaign.id);
    console.log(" - job:", job.id);
    console.log(" - proposal:", proposal.id);
    console.log(" - collaboration:", collab.id);

    await AppDataSource.destroy();
    console.log("Data source destroyed, seed finished.");
  } catch (error) {
    console.error("Seeding error:", error);
    try {
      await AppDataSource.destroy();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

seed();
