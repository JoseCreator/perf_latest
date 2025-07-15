import express from 'express';

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

export default router;
