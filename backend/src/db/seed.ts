import { query } from './connection';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Seed script for Electoral Strategy database
 *
 * This script validates that the game data files are accessible
 * and optionally seeds any reference data needed.
 *
 * Note: Game states and cards are loaded dynamically per-game,
 * not stored as reference data in the database.
 */

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Verify database connection
    console.log('📡 Testing database connection...');
    const result = await query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log(`   Server time: ${result.rows[0].now}\n`);

    // Verify game data files exist
    console.log('📂 Checking game data files...');
    const cardsPath = path.join(__dirname, '../data/Electoral_Strategy_Cards.json');
    const statesPath = path.join(__dirname, '../data/Electoral_Strategy_States.json');

    if (!fs.existsSync(cardsPath)) {
      throw new Error(`Cards file not found: ${cardsPath}`);
    }
    console.log('✅ Cards data file found');

    if (!fs.existsSync(statesPath)) {
      throw new Error(`States file not found: ${statesPath}`);
    }
    console.log('✅ States data file found');

    // Load and validate data files
    console.log('\n📊 Validating game data...');
    const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf-8'));

    console.log(`   Cards loaded: ${cardsData.cards?.length || 0} cards`);
    console.log(`   States loaded: ${statesData.states?.length || 0} states`);
    console.log(`   Total electoral votes: ${statesData.total_electoral_votes || 0}`);
    console.log(`   Victory threshold: ${statesData.victory_threshold || 0}`);

    // Check database tables exist
    console.log('\n🗂️  Verifying database schema...');
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map(r => r.table_name);
    console.log(`   Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

    const expectedTables = [
      'games',
      'players',
      'player_hands',
      'game_states',
      'active_events',
      'game_log',
      'discard_pile'
    ];

    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Warning: Missing tables: ${missingTables.join(', ')}`);
      console.log('   Run "npm run db:setup" to create schema\n');
    } else {
      console.log('✅ All required tables present');
    }

    // Count existing data
    console.log('\n📈 Current database state:');
    const gameCount = await query('SELECT COUNT(*) FROM games');
    const playerCount = await query('SELECT COUNT(*) FROM players');
    console.log(`   Games: ${gameCount.rows[0].count}`);
    console.log(`   Players: ${playerCount.rows[0].count}`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('💡 Note: Game states and cards are created dynamically when');
    console.log('   players create new games. No static seeding required.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  seedDatabase();
}
