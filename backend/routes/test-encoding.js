import express from 'express';
import { fixDatabaseEncoding, checkDatabaseCorruption } from './fix-encoding.js';

const router = express.Router();

// Test endpoint to verify UTF-8 encoding
router.get('/test', (req, res) => {
  const testData = {
    message: 'Teste de codificação UTF-8',
    portugueseChars: {
      special: 'ção, ã, õ, ç, á, é, í, ó, ú',
      words: ['Configurações', 'Informação', 'Descrição', 'Função', 'Ações'],
      sentence: 'Este é um teste para verificar se os caracteres portugueses estão sendo exibidos corretamente.'
    },
    status: 'success'
  };
  
  res.json(testData);
});

// Endpoint to check for corrupted data
router.get('/check-corruption', async (req, res) => {
  try {
    console.log('🔍 Corruption check requested');
    const report = await checkDatabaseCorruption();
    
    res.json({
      success: true,
      message: 'Database corruption check completed',
      report: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Corruption check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check corruption',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to fix Portuguese character encoding in the database
router.post('/fix-encoding', async (req, res) => {
  try {
    console.log('🔧 Manual encoding fix requested');
    const fixedCount = await fixDatabaseEncoding();
    
    res.json({
      success: true,
      message: 'Encoding fix completed successfully',
      recordsFixed: fixedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Encoding fix failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix encoding',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
