// dotenv must load first — this script runs outside NestJS.
import 'dotenv/config';
import { AppDataSource } from '../config/data-source.js';

async function seed(): Promise<void> {
    console.log('\n▶  Running seed...\n');
    await AppDataSource.initialize();
    console.log('  ✔  Database connection established');
    // Add seeders here.
    console.log('\n✔  Seed completed.\n');
    await AppDataSource.destroy();
}

seed();
