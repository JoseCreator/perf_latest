import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp directory in production (Render), local path in development
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/timetracker.db'
  : path.resolve(__dirname, '../timetracker.db');

export async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await getDb();
  
  // Check if database has any tables
  try {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    
    // If we have the utilizadores table, check if we have users
    if (tableNames.includes('utilizadores')) {
      const userCount = await db.get('SELECT COUNT(*) as count FROM utilizadores WHERE active = 1');
      
      if (userCount.count > 0) {
        console.log(`✅ Database initialized with ${userCount.count} users`);
        await db.close();
        return;
      }
    }
    
    // If no tables exist, try to restore from SQL dump
    if (tableNames.length === 0) {
      console.log('🔄 No tables found, attempting to restore from SQL dump...');
      
      const sqlDumpPath = path.resolve(__dirname, '../database-production.sql');
      
      if (fs.existsSync(sqlDumpPath)) {
        console.log('📄 Found SQL dump file: database-production.sql');
        
        try {
          let sqlContent = fs.readFileSync(sqlDumpPath, 'utf8');
          
          // Clean the SQL content
          sqlContent = sqlContent
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .replace(/�/g, '') // Remove replacement characters
            .trim();
          
          // Execute the SQL dump
          await db.exec(sqlContent);
          
          console.log('✅ Database restored from SQL dump successfully');
          
          // Verify restoration
          const restoredTables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
          const userCount = await db.get('SELECT COUNT(*) as count FROM utilizadores WHERE active = 1').catch(() => ({ count: 0 }));
          const timesheetCount = await db.get('SELECT COUNT(*) as count FROM timesheet').catch(() => ({ count: 0 }));
          
          console.log(`✅ Restored ${userCount.count} active users and ${timesheetCount.count} timesheet records`);
          
          // In production, ensure admin password is set correctly
          if (process.env.NODE_ENV === 'production') {
            await setupProductionPasswords(db);
          }
          
          await db.close();
          return;
          
        } catch (fileError) {
          console.log(`❌ Failed to restore from SQL dump: ${fileError.message}`);
          console.log('🔄 Will create new database schema...');
        }
      } else {
        console.log('⚠️  No SQL dump file found, creating new database schema...');
      }
    }
    
    // Continue with existing logic if tables exist or no dump available
    const requiredTables = ['utilizadores', 'timesheet', 'clients', 'projects'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('Missing required tables:', missingTables);
      
      // Create any missing essential tables with your schema
      if (!tableNames.includes('utilizadores')) {
        await db.exec(`CREATE TABLE utilizadores (
          user_id INTEGER PRIMARY KEY,
          First_Name TEXT,
          Last_Name TEXT,
          email TEXT,
          password TEXT,
          role INTEGER,
          groups INTEGER,
          rate_id REAL,
          active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Created utilizadores table');
      }
      
      if (!tableNames.includes('timesheet')) {
        await db.exec(`CREATE TABLE timesheet (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          group_id INTEGER,
          client_id INTEGER,
          project_id INTEGER,
          category_id INTEGER,
          task_id INTEGER,
          rate_user_id REAL,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          hours REAL,
          description TEXT,
          billable BOOLEAN,
          overtime BOOLEAN,
          total_hours REAL,
          approved BOOLEAN,
          activity_id REAL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          group_name TEXT,
          rate_value REAL
        )`);
        console.log('Created timesheet table');
      }
      
      if (!tableNames.includes('clients')) {
        await db.exec(`CREATE TABLE clients (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Created clients table');
      }
      
      if (!tableNames.includes('projects')) {
        await db.exec(`CREATE TABLE projects (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          client_id INTEGER,
          active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )`);
        console.log('Created projects table');
      }
      
      if (!tableNames.includes('absences')) {
        await db.exec(`CREATE TABLE absences (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          absence_type TEXT,
          start_date TEXT,
          end_date TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES utilizadores(user_id)
        )`);
        console.log('Created absences table');
      }
      

    }
    
    // Check if we have users in the database
    const userCount = await db.get('SELECT COUNT(*) as count FROM utilizadores WHERE active = 1');
    console.log(`Found ${userCount.count} active users in database`);
    
    if (userCount.count === 0) {
      console.log('No active users found, creating default admin user...');
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(`INSERT INTO utilizadores (First_Name, Last_Name, email, password, role, active) 
                    VALUES (?, ?, ?, ?, ?, ?)`, 
                   ['Admin', 'User', 'admin@example.com', hashedPassword, 1, 1]);
      console.log('Default admin user created (email: admin@example.com, password: admin123)');
    } else {
      console.log('Using existing user data');
      
      // In production, ensure admin password is set correctly
      if (process.env.NODE_ENV === 'production') {
        await setupProductionPasswords(db);
      }
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error);
    throw error;
  }

  console.log('Database initialized successfully');
  console.log('Database file exists:', fs.existsSync(dbPath));
  
  await db.close();
}

async function setupProductionPasswords(db) {
  console.log('🔧 Setting up production passwords...');
  
  try {
    const bcrypt = await import('bcrypt');
    
    // Check and fix admin user
    const adminUser = await db.get('SELECT * FROM utilizadores WHERE email = ?', ['suporte@grupoerre.pt']);
    
    if (adminUser) {
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run('UPDATE utilizadores SET password = ? WHERE email = ?', [hashedPassword, 'suporte@grupoerre.pt']);
      console.log('✅ Admin password updated successfully');
    } else {
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run(`INSERT INTO utilizadores (First_Name, Last_Name, email, password, role, active) 
                   VALUES (?, ?, ?, ?, ?, ?)`, 
                   ['Admin', 'Local', 'suporte@grupoerre.pt', hashedPassword, 1, 1]);
      console.log('✅ Admin user created successfully');
    }
    
    // Note: User passwords should be set through proper admin interface
    // Hardcoded password initialization removed for security
    console.log('✅ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Error setting up passwords:', error);
  }
}
