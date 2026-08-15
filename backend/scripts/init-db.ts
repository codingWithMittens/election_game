import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../src/db/connection';

async function initializeDatabase() {
  try {
    console.log('🗄️  Initializing database...');

    // Read and execute schema
    const schemaPath = join(__dirname, '../src/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await query(schema);
    console.log('✅ Schema created successfully');

    // Import seed module dynamically
    const { seedDatabase } = await import('../src/db/seed');
    await seedDatabase();

    console.log('✅ Database initialized and seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
