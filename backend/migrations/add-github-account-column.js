import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addGithubAccountColumn() {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/timetracker.db'
    : path.resolve(__dirname, '../timetracker.db');

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if the github_account column already exists
    const tableInfo = await db.all("PRAGMA table_info(utilizadores)");
    const hasGithubColumn = tableInfo.some(column => column.name === 'github_account');

    if (!hasGithubColumn) {
      console.log('Adding github_account column to utilizadores table...');
      await db.exec('ALTER TABLE utilizadores ADD COLUMN github_account TEXT');
      console.log('✅ Successfully added github_account column');
    } else {
      console.log('✅ github_account column already exists');
    }

  } catch (error) {
    console.error('❌ Error adding github_account column:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('add-github-account-column.js')) {
  console.log('🚀 Running migration directly...');
  addGithubAccountColumn()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { addGithubAccountColumn };
