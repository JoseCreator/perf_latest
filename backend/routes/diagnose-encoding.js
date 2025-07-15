import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Enhanced diagnostic endpoint to see actual corrupted data
router.get('/diagnose-corruption', async (req, res) => {
  let db = null;
  try {
    const dbPath = join(__dirname, '..', 'timetracker.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const tables = ['utilizadores', 'clients', 'projects', 'timesheet'];
    const corruptedSamples = {};
    
    for (const table of tables) {
      try {
        const rows = await db.all(`SELECT * FROM ${table} LIMIT 50`);
        const tableCorruption = [];
        
        for (const row of rows) {
          for (const [field, value] of Object.entries(row)) {
            if (value && typeof value === 'string') {
              // Check for any non-ASCII characters or common corruption patterns
              const hasNonAscii = /[^\x00-\x7F]/.test(value);
              const hasQuestionMarks = value.includes('??');
              const hasStrangeChars = /[ÃÂÄ]/.test(value);
              
              if (hasNonAscii || hasQuestionMarks || hasStrangeChars) {
                tableCorruption.push({
                  id: row.id || row.user_id || 'unknown',
                  field,
                  value,
                  charCodes: [...value].map(char => ({
                    char,
                    code: char.charCodeAt(0),
                    hex: char.charCodeAt(0).toString(16)
                  })),
                  hasNonAscii,
                  hasQuestionMarks,
                  hasStrangeChars
                });
              }
            }
          }
        }
        
        if (tableCorruption.length > 0) {
          corruptedSamples[table] = tableCorruption.slice(0, 10); // Limit to 10 samples per table
        }
      } catch (error) {
        console.log(`Table ${table} diagnostic failed:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Corruption diagnosis completed',
      corruptedSamples,
      totalTables: Object.keys(corruptedSamples).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Corruption diagnosis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to diagnose corruption',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
});

// Enhanced fix endpoint that shows what was actually changed
router.post('/fix-encoding-detailed', async (req, res) => {
  let db = null;
  try {
    const dbPath = join(__dirname, '..', 'timetracker.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const tables = ['utilizadores', 'clients', 'projects', 'timesheet'];
    const changes = [];
    let totalFixed = 0;

    // Comprehensive character mapping
    const characterMap = {
      // Double-encoded UTF-8 patterns
      'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã§': 'ç',
      'Ã©': 'é', 'Ãª': 'ê', 'Ã­': 'í', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ãº': 'ú',
      'Ã': 'Á', 'Ã‡': 'Ç', 'Ã‰': 'É', 'Ã"': 'Ó', 'Ãš': 'Ú',
      
      // Question mark patterns
      'Gon??alves': 'Gonçalves', 'Jo??o': 'João', 'Mar??a': 'Maria',
      'Ant??nio': 'António', 'Jos??': 'José', 'Lu??s': 'Luís',
      'Andr??': 'André', 'In??s': 'Inês', 'Concei????o': 'Conceição',
      'configura????o': 'configuração', 'informa????es': 'informações',
      'solu????o': 'solução', 'administra????o': 'administração',
      'situa????o': 'situação', 'fun????o': 'função', 'gest??o': 'gestão',
      
      // Other common patterns
      'Ã§Ã£o': 'ção', 'Ã§Ãµes': 'ções', 'Ã¼es': 'ues',
      'Ãªncia': 'ência', 'Ã¡rio': 'ário', 'Ã¡ria': 'ária'
    };

    // Function to fix text using comprehensive mapping
    function fixText(text) {
      if (!text || typeof text !== 'string') return text;
      
      let result = text;
      for (const [corrupted, correct] of Object.entries(characterMap)) {
        result = result.split(corrupted).join(correct);
      }
      
      // Additional patterns using regex for remaining ?? patterns
      result = result.replace(/(\w)\?\?(\w)/g, (match, before, after) => {
        // Common Portuguese character combinations
        const patterns = {
          'ca': 'ça', 'co': 'ço', 'cu': 'çu',
          'ao': 'ão', 'oe': 'õe', 'os': 'ões',
          'ae': 'ãe', 'ai': 'ãi', 'an': 'ân'
        };
        const key = before + after;
        return patterns[key] || match;
      });
      
      return result;
    }

    for (const table of tables) {
      try {
        const rows = await db.all(`SELECT * FROM ${table}`);
        
        for (const row of rows) {
          const updates = {};
          let hasUpdates = false;

          for (const [field, value] of Object.entries(row)) {
            if (value && typeof value === 'string') {
              const fixedValue = fixText(value);
              if (fixedValue !== value) {
                updates[field] = fixedValue;
                hasUpdates = true;
                changes.push({
                  table,
                  id: row.id || row.user_id,
                  field,
                  before: value,
                  after: fixedValue
                });
              }
            }
          }

          if (hasUpdates) {
            const setClause = Object.keys(updates)
              .map(field => `${field} = ?`)
              .join(', ');
            const values = [...Object.values(updates), row.id || row.user_id];
            
            await db.run(`UPDATE ${table} SET ${setClause} WHERE ${row.id ? 'id' : 'user_id'} = ?`, values);
            totalFixed++;
          }
        }
      } catch (error) {
        console.log(`Error fixing table ${table}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Detailed encoding fix completed',
      totalRecordsFixed: totalFixed,
      changes: changes.slice(0, 50), // Limit response size
      totalChanges: changes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Detailed encoding fix failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix encoding',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
});

export default router;
