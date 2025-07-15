// Script to create SQL dump for production deployment
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSQLDump() {
  const dbPath = path.resolve(__dirname, 'timetracker.db');
  const outputPath = path.resolve(__dirname, 'database-production.sql');
  
  console.log('🔄 Creating SQL dump for production deployment...');
  console.log('📍 Source database:', dbPath);
  console.log('📄 Output file:', outputPath);
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Get all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    console.log(`📊 Found ${tables.length} tables to export`);
    
    let sqlDump = `-- PerformPass Database Dump
-- Generated: ${new Date().toISOString()}
-- Tables: ${tables.length}

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

`;
    
    // Export each table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`📝 Exporting table: ${tableName}`);
      
      // Get table schema
      const schema = await db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS "${tableName}";\n`;
      sqlDump += `${schema.sql};\n\n`;
      
      // Get table data
      const rows = await db.all(`SELECT * FROM "${tableName}"`);
      console.log(`  📈 ${rows.length} records`);
      
      if (rows.length > 0) {
        // Get column names
        const columns = Object.keys(rows[0]);
        
        sqlDump += `-- Data for table: ${tableName}\n`;
        for (const row of rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          }).join(',');
          
          sqlDump += `INSERT INTO "${tableName}" VALUES(${values});\n`;
        }
        sqlDump += '\n';
      }
    }
    
    sqlDump += `COMMIT;
PRAGMA foreign_keys=ON;
`;
    
    // Write to file
    fs.writeFileSync(outputPath, sqlDump, 'utf8');
    
    await db.close();
    
    console.log('✅ SQL dump created successfully!');
    console.log(`📁 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error creating SQL dump:', error);
    process.exit(1);
  }
}

createSQLDump();
