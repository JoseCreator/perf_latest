import { getDb } from './db.js';

// Map of corrupted characters to correct Portuguese characters
const CHARACTER_MAP = {
  'Gon??alves': 'Gonçalves',
  'Ant??nio': 'António',
  'Jos??': 'José',
  'Jo??o': 'João',
  'A??ores': 'Açores',
  'Crist??v??o': 'Cristóvão',
  'Sebasti??o': 'Sebastião',
  'Concei????o': 'Conceição',
  'Encarna????o': 'Encarnação',
  'Atrac????o': 'Atracção',
  'Cria????o': 'Criação',
  'Fun????o': 'Função',
  'Ac????o': 'Acção',
  'Ac????es': 'Acções',
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
  'Atualiza????o': 'Actualização',
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
  // Common pattern replacements
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
  '????': 'ção',
  '????': 'ções',
  '???o': 'ção',
  '???es': 'ções'
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
