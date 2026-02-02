import dotenv from 'dotenv';
dotenv.config();

import AppDataSource from '../db/data-source';
import { Business } from '../db/entity/Business.entity';

async function createBusiness() {
  try {
    await AppDataSource.initialize();
    console.log('Data source initialized');

    const business = new Business();
    business.name = 'Seed Brand Co';
    business.websiteUrl = 'https://brand.example.com';
    business.address = '123 Brand St';
    business.email = 'brand@example.com';
    business.industry = 'Consumer Tech';
    business.logoUrl = 'https://example.com/logo.png';

    await business.save();

    console.log('Created business:', business.id);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Create business error:', err);
    try { await AppDataSource.destroy(); } catch(e) {}
    process.exit(1);
  }
}

createBusiness();
