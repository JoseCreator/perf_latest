import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Portuguese character mapping for fixing encoding issues
const characterMap = {
    // Common ?? replacements for Portuguese characters
    'Gon??alves': 'Gonçalves',
    'Jo??o': 'João', 
    'Mar??a': 'Maria',
    'Ant??nio': 'António', 
    'Jos??': 'José', 
    'Lu??s': 'Luís',
    'Andr??': 'André', 
    'In??s': 'Inês',
    'Concei????o': 'Conceição', 
    'Sebasti??o': 'Sebastião',
    'cria????o': 'criação', 
    'informa????es': 'informações',
    'solu????o': 'solução', 
    'configura????o': 'configuração',
    'administra????o': 'administração', 
    'situa????o': 'situação',
    'avan??ado': 'avançado', 
    'configura????es': 'configurações',
    'fun????o': 'função',
    'gest??o': 'gestão',
    'rela????o': 'relação',
    'vers??o': 'versão',
    'edi????o': 'edição',
    'produ????o': 'produção',
    'instala????o': 'instalação',
    'opera????o': 'operação',
    'execu????o': 'execução'
};

/**
 * Fix Portuguese characters in a text string
 * @param {string} text - Text to fix
 * @returns {string} - Fixed text
 */
export function fixPortugueseChars(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    let result = text;
    
    // Use split/join instead of regex to avoid metacharacter issues
    for (const [corrupted, correct] of Object.entries(characterMap)) {
        result = result.split(corrupted).join(correct);
    }
    
    return result;
}

/**
 * Check if text contains corrupted Portuguese characters
 * @param {string} text - Text to check
 * @returns {boolean} - True if corrupted characters found
 */
export function hasCorruptedChars(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    // Check for common corruption patterns
    const corruptionPatterns = [
        '??', 'Gon??alves', 'Jo??o', 'configura????o', 'informa????es',
        'solu????o', 'administra????o', 'cria????o', 'situa????o',
        'Concei????o', 'avan??ado', 'configura????es'
    ];
    
    return corruptionPatterns.some(pattern => text.includes(pattern));
}

/**
 * Check database for corrupted Portuguese characters
 * @returns {Promise<{corrupted: boolean, details: Array}>}
 */
export async function checkDatabaseCorruption() {
    let db = null;
    try {
        const dbPath = join(__dirname, '..', 'timetracker.db');
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        const tables = ['users', 'projects', 'clients', 'timeEntries'];
        const corruptionDetails = [];

        for (const table of tables) {
            try {
                const rows = await db.all(`SELECT * FROM ${table}`);
                
                for (const row of rows) {
                    for (const [field, value] of Object.entries(row)) {
                        if (hasCorruptedChars(value)) {
                            corruptionDetails.push({
                                table,
                                id: row.id,
                                field,
                                corrupted: value,
                                fixed: fixPortugueseChars(value)
                            });
                        }
                    }
                }
            } catch (error) {
                console.log(`Table ${table} may not exist or is empty:`, error.message);
            }
        }

        return {
            corrupted: corruptionDetails.length > 0,
            details: corruptionDetails
        };

    } catch (error) {
        console.error('Error checking database corruption:', error);
        return {
            corrupted: false,
            details: [],
            error: error.message
        };
    } finally {
        if (db) {
            await db.close();
        }
    }
}

/**
 * Fix corrupted Portuguese characters in database
 * @returns {Promise<{success: boolean, fixed: number, errors: Array}>}
 */
export async function fixDatabaseEncoding() {
    let db = null;
    try {
        const dbPath = join(__dirname, '..', 'timetracker.db');
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        const tables = ['users', 'projects', 'clients', 'timeEntries'];
        let totalFixed = 0;
        const errors = [];

        for (const table of tables) {
            try {
                const rows = await db.all(`SELECT * FROM ${table}`);
                
                for (const row of rows) {
                    const updates = {};
                    let hasUpdates = false;

                    for (const [field, value] of Object.entries(row)) {
                        if (hasCorruptedChars(value)) {
                            updates[field] = fixPortugueseChars(value);
                            hasUpdates = true;
                        }
                    }

                    if (hasUpdates) {
                        const setClause = Object.keys(updates)
                            .map(field => `${field} = ?`)
                            .join(', ');
                        const values = [...Object.values(updates), row.id];
                        
                        await db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
                        totalFixed++;
                    }
                }
            } catch (error) {
                const errorMsg = `Error fixing table ${table}: ${error.message}`;
                console.log(errorMsg);
                errors.push(errorMsg);
            }
        }

        return {
            success: true,
            fixed: totalFixed,
            errors
        };

    } catch (error) {
        console.error('Error fixing database encoding:', error);
        return {
            success: false,
            fixed: 0,
            errors: [error.message]
        };
    } finally {
        if (db) {
            await db.close();
        }
    }
}
