const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔄 Creating clean SQL dump from database...');

const dbPath = path.join(__dirname, 'timetracker.db');
const outputPath = path.join(__dirname, 'database-production-clean.sql');

if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database opened successfully');
});

let sqlDump = '';

// Add pragma and transaction start
sqlDump += 'PRAGMA foreign_keys=OFF;\n';
sqlDump += 'BEGIN TRANSACTION;\n';

// Get all table schemas
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
    if (err) {
        console.error('❌ Error getting table schemas:', err.message);
        process.exit(1);
    }

    console.log(`📋 Found ${tables.length} tables`);
    
    // Add CREATE TABLE statements
    tables.forEach(table => {
        if (table.sql) {
            sqlDump += table.sql + ';\n';
        }
    });

    // Get all table names for data export
    const tableNames = tables.map(t => {
        const match = t.sql.match(/CREATE TABLE (\w+)/);
        return match ? match[1] : null;
    }).filter(Boolean);

    let completedTables = 0;

    if (tableNames.length === 0) {
        sqlDump += 'COMMIT;\n';
        fs.writeFileSync(outputPath, sqlDump);
        console.log('✅ Clean SQL dump created successfully');
        db.close();
        return;
    }

    // Export data for each table
    tableNames.forEach(tableName => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.error(`❌ Error reading table ${tableName}:`, err.message);
                return;
            }

            console.log(`📊 Exporting ${rows.length} rows from ${tableName}`);

            if (rows.length > 0) {
                // Get column names
                db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                    if (err) {
                        console.error(`❌ Error getting columns for ${tableName}:`, err.message);
                        return;
                    }

                    const columnNames = columns.map(col => col.name);

                    rows.forEach(row => {
                        const values = columnNames.map(col => {
                            let value = row[col];
                            if (value === null) {
                                return 'NULL';
                            } else if (typeof value === 'string') {
                                // Escape single quotes and wrap in quotes
                                return "'" + value.replace(/'/g, "''") + "'";
                            } else {
                                return value;
                            }
                        });

                        sqlDump += `INSERT INTO ${tableName} VALUES(${values.join(',')});\n`;
                    });

                    completedTables++;
                    if (completedTables === tableNames.length) {
                        sqlDump += 'COMMIT;\n';
                        fs.writeFileSync(outputPath, sqlDump, 'utf8');
                        console.log('✅ Clean SQL dump created successfully');
                        console.log(`📄 Output: ${outputPath}`);
                        console.log(`📊 Total size: ${fs.statSync(outputPath).size} bytes`);
                        db.close();
                    }
                });
            } else {
                completedTables++;
                if (completedTables === tableNames.length) {
                    sqlDump += 'COMMIT;\n';
                    fs.writeFileSync(outputPath, sqlDump, 'utf8');
                    console.log('✅ Clean SQL dump created successfully');
                    console.log(`📄 Output: ${outputPath}`);
                    db.close();
                }
            }
        });
    });
});
