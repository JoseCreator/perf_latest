import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addGithubProjectColumn() {
  console.log('🔄 Starting GitHub_project column migration...');
  
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/timetracker.db'
    : path.resolve(__dirname, '../timetracker.db');

  console.log('📁 Database path:', dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if the GitHub_project column already exists
    console.log('🔍 Checking existing columns in projects table...');
    const tableInfo = await db.all("PRAGMA table_info(projects)");
    console.log('📋 Current projects table columns:', tableInfo.map(col => col.name));
    
    const hasGithubColumn = tableInfo.some(column => column.name === 'GitHub_project');

    if (!hasGithubColumn) {
      console.log('➕ Adding GitHub_project column to projects table...');
      await db.exec('ALTER TABLE projects ADD COLUMN GitHub_project TEXT');
      console.log('✅ Successfully added GitHub_project column');
    } else {
      console.log('✅ GitHub_project column already exists');
    }

  } catch (error) {
    console.error('❌ Error adding GitHub_project column:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('add-github-project-column.js')) {
  console.log('🚀 Running migration directly...');
  addGithubProjectColumn()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { addGithubProjectColumn };
