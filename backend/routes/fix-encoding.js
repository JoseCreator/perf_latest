import { getDb } from './db.js';

// Map of corrupted characters to correct Portuguese characters
const CHARACTER_MAP = {
  // Complete names that are corrupted
  'Gon??alves': 'Gonçalves',
  'Ant??nio': 'António',
  'Jos??': 'José',
  'Jo??o': 'João',
  'A??ores': 'Açores',
  'Crist??v??o': 'Cristóvão',
  'Sebasti??o': 'Sebastião',
  'Concei????o': 'Conceição',
  'Encarna????o': 'Encarnação',
  
  // Common Portuguese words
  'Atrac????o': 'Atração',
  'Cria????o': 'Criação',
  'Fun????o': 'Função',
  'Ac????o': 'Ação',
  'Ac????es': 'Ações',
  'Informa????o': 'Informação',
  'Configura????es': 'Configurações',
  'Descri????o': 'Descrição',
  'Conex??o': 'Conexão',
  'Reuni??o': 'Reunião',
  'Solu????o': 'Solução',
  'Integra????o': 'Integração',
  'Administra????o': 'Administração',
  'Utiliza????o': 'Utilização',
  'Organiza????o': 'Organização',
  'Atualiza????o': 'Atualização',
  'Verifica????o': 'Verificação',
  'Publica????o': 'Publicação',
  'Aplica????o': 'Aplicação',
  'Identifica????o': 'Identificação',
  'Especifica????o': 'Especificação',
  'Implementa????o': 'Implementação',
  'Valida????o': 'Validação',
  'Autentica????o': 'Autenticação',
  'Autoriza????o': 'Autorização',
  'Navega????o': 'Navegação',
  'Instala????o': 'Instalação',
  'Configura????o': 'Configuração',
  
  // Individual character replacements (more patterns)
  '??': 'ç',
  '??': 'ã',
  '??': 'õ',
  '??': 'á',
  '??': 'é', 
  '??': 'í',
  '??': 'ó',
  '??': 'ú',
  '??': 'â',
  '??': 'ê',
  '??': 'ô',
  '??': 'à',
  '??': 'è',
  '??': 'ì',
  '??': 'ò',
  '??': 'ù',
  '??': 'ü',
  '??': 'Ç',
  '??': 'Ã',
  '??': 'Õ',
  '??': 'Á',
  '??': 'É',
  '??': 'Í',
  '??': 'Ó',
  '??': 'Ú',
  '??': 'Â',
  '??': 'Ê',
  '??': 'Ô',
  '??': 'À',
  '??': 'È',
  '??': 'Ì',
  '??': 'Ò',
  '??': 'Ù',
  
  // Common patterns
  '????': 'ção',
  '????es': 'ções',
  '???o': 'ção',
  '???es': 'ções',
  '??es': 'ções',
  '??o': 'ção',
  
  // Additional patterns found in databases
  'â€™': "'",
  'â€œ': '"',
  'â€': '"',
  'â€¦': '...',
  'â€"': '–',
  'â€"': '—',
  
  // UTF-8 to Latin-1 double encoding issues
  'Ã§': 'ç',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ã¡': 'á',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã': 'à',
  'Ã¨': 'è',
  'Ã¬': 'ì',
  'Ã²': 'ò',
  'Ã¹': 'ù',
  'Ã¢': 'â',
  'Ãª': 'ê',
  'Ã´': 'ô',
  'Ã¼': 'ü',
  'Ã§Ã£o': 'ção',
  'Ã§Ã£': 'ção',
  'Ã§Ã': 'ção'
};

/**
 * Fix corrupted Portuguese characters in a text string
 */
function fixPortugueseChars(text) {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  
  // Apply character map replacements
  for (const [corrupted, correct] of Object.entries(CHARACTER_MAP)) {
    fixed = fixed.replace(new RegExp(corrupted, 'gi'), correct);
  }
  
  return fixed;
}

/**
 * Detect if text contains corrupted Portuguese characters
 */
function hasCorruptedChars(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Check for common corruption patterns
  const corruptionPatterns = [
    /\?\?/,           // Double question marks
    /\?\?\?\?/,       // Quadruple question marks  
    /Ã[§£©¡­³º\u00A0-\u00FF]/,  // UTF-8 double encoding
    /â€[™œ"¦"]/      // Smart quotes corruption
  ];
  
  return corruptionPatterns.some(pattern => pattern.test(text));
}

/**
 * Check database for corrupted data
 */
export async function checkDatabaseCorruption() {
  console.log('🔍 Checking database for Portuguese character corruption...');
  
  const db = await getDb();
  const corruptionReport = {
    tables: {},
    totalCorrupted: 0,
    samplesFound: []
  };
  
  try {
    const tablesToCheck = [
      { name: 'utilizadores', columns: ['First_Name', 'Last_Name', 'email'] },
      { name: 'clients', columns: ['name', 'description'] },
      { name: 'projects', columns: ['project_name', 'project_description'] },
      { name: 'timesheet', columns: ['activity_description', 'notes'] }
    ];
    
    for (const table of tablesToCheck) {
      const tableExists = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?", 
        [table.name]
      );
      
      if (!tableExists) {
        corruptionReport.tables[table.name] = { status: 'not_found', corrupted: 0 };
        continue;
      }
      
      const rows = await db.all(`SELECT * FROM ${table.name} LIMIT 100`);
      let corrupted = 0;
      
      for (const row of rows) {
        for (const column of table.columns) {
          const value = row[column];
          if (hasCorruptedChars(value)) {
            corrupted++;
            corruptionReport.samplesFound.push({
              table: table.name,
              column: column,
              original: value,
              fixed: fixPortugueseChars(value)
            });
            if (corruptionReport.samplesFound.length >= 10) break; // Limit samples
          }
        }
        if (corruptionReport.samplesFound.length >= 10) break;
      }
      
      corruptionReport.tables[table.name] = { 
        status: 'checked', 
        totalRows: rows.length,
        corrupted: corrupted 
      };
      corruptionReport.totalCorrupted += corrupted;
    }
    
    console.log(`🔍 Corruption check complete. Found ${corruptionReport.totalCorrupted} corrupted records`);
    
  } catch (error) {
    console.error('❌ Error checking database corruption:', error.message);
    corruptionReport.error = error.message;
  } finally {
    await db.close();
  }
  
  return corruptionReport;
}

/**
 * Update all text fields in a table to fix Portuguese character encoding
 */
async function fixTableEncoding(db, tableName, textColumns) {
  console.log(`🔧 Fixing encoding in table: ${tableName}`);
  
  try {
    // Get all rows from the table
    const rows = await db.all(`SELECT * FROM ${tableName}`);
    console.log(`   Found ${rows.length} rows to check`);
    
    let fixedCount = 0;
    
    for (const row of rows) {
      const updates = {};
      let hasChanges = false;
      
      // Check each text column for corrupted characters
      for (const column of textColumns) {
        const originalValue = row[column];
        if (originalValue && typeof originalValue === 'string') {
          const fixedValue = fixPortugueseChars(originalValue);
          if (fixedValue !== originalValue) {
            updates[column] = fixedValue;
            hasChanges = true;
            console.log(`   Fixed: "${originalValue}" → "${fixedValue}"`);
          }
        }
      }
      
      // Update the row if we found corrupted characters
      if (hasChanges) {
        const setClause = Object.keys(updates).map(col => `${col} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(row.id || row.user_id || row.client_id || row.project_id); // Add the ID for WHERE clause
        
        // Determine the primary key column
        let pkColumn = 'id';
        if (row.user_id && !row.id) pkColumn = 'user_id';
        else if (row.client_id && !row.id) pkColumn = 'client_id';
        else if (row.project_id && !row.id) pkColumn = 'project_id';
        
        await db.run(`UPDATE ${tableName} SET ${setClause} WHERE ${pkColumn} = ?`, values);
        fixedCount++;
      }
    }
    
    console.log(`   ✅ Fixed ${fixedCount} rows in ${tableName}`);
    return fixedCount;
  } catch (error) {
    console.error(`   ❌ Error fixing encoding in ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Main function to fix Portuguese character encoding across all tables
 */
export async function fixDatabaseEncoding() {
  console.log('🔧 Starting Portuguese character encoding fix...');
  
  const db = await getDb();
  let totalFixed = 0;
  
  try {
    // Define tables and their text columns that might contain Portuguese characters
    const tablesToFix = [
      {
        name: 'utilizadores',
        columns: ['First_Name', 'Last_Name', 'email', 'role']
      },
      {
        name: 'clients', 
        columns: ['name', 'description']
      },
      {
        name: 'projects',
        columns: ['project_name', 'project_description']
      },
      {
        name: 'timesheet',
        columns: ['activity_description', 'notes']
      },
      {
        name: 'groups',
        columns: ['name', 'description']
      },
      {
        name: 'categories',
        columns: ['name', 'description']
      }
    ];
    
    // Fix encoding for each table
    for (const table of tablesToFix) {
      // Check if table exists first
      const tableExists = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?", 
        [table.name]
      );
      
      if (tableExists) {
        const fixed = await fixTableEncoding(db, table.name, table.columns);
        totalFixed += fixed;
      } else {
        console.log(`   ⚠️  Table ${table.name} does not exist, skipping`);
      }
    }
    
    console.log(`✅ Encoding fix complete! Fixed ${totalFixed} total records`);
    
  } catch (error) {
    console.error('❌ Error during encoding fix:', error.message);
  } finally {
    await db.close();
  }
  
  return totalFixed;
}
