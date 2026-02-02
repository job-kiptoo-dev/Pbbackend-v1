import dotenv from 'dotenv';
dotenv.config();

import AppDataSource from '../db/data-source';
import { User } from '../db/entity/User';
import { CreatorProfile } from '../db/entity/CreatorProfile.entity';
import { Campaign } from '../db/entity/Campaign.entity';
import { Job, JobProposal } from '../db/entity/Job.entity';
import { CollaborationEntity } from '../db/entity/Collaboration.entity';

async function exportSeed() {
  try {
    await AppDataSource.initialize();
    // Fetch seeded records
    const users = await User.find();
    const profiles = await CreatorProfile.find({ relations: ['user'] });
    const campaigns = await Campaign.find();
    const jobs = await Job.find({ relations: ['owner', 'proposals'] });
    const proposals = await JobProposal.find({ relations: ['proposer', 'job'] });
    const collaborations = await CollaborationEntity.find({ relations: ['inviter', 'invitee', 'campaign', 'business'] });

    const output = {
      users,
      creatorProfiles: profiles,
      campaigns,
      jobs,
      proposals,
      collaborations,
    };

    console.log(JSON.stringify(output, null, 2));

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Export error:', error);
    try { await AppDataSource.destroy(); } catch(e) {}
    process.exit(1);
  }
}

exportSeed();
