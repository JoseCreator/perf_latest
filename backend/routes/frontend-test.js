import express from 'express';

const router = express.Router();

// Frontend encoding test endpoint
router.get('/', (req, res) => {
  // Set explicit UTF-8 headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  
  const testData = {
    message: 'Frontend encoding test',
    portugueseNames: [
      'João Silva',
      'Maria Gonçalves', 
      'António José',
      'Inês Santos',
      'José Luís'
    ],
    portugueseWords: [
      'configuração',
      'informações',
      'gestão',
      'solução',
      'função',
      'versão',
      'criação',
      'situação'
    ],
    specialChars: {
      'a-accents': ['á', 'à', 'â', 'ã'],
      'e-accents': ['é', 'ê', 'è'],
      'i-accents': ['í', 'î', 'ì'],
      'o-accents': ['ó', 'ô', 'ò', 'õ'],
      'u-accents': ['ú', 'û', 'ù'],
      'c-cedilla': ['ç', 'Ç'],
      'n-tilde': ['ñ', 'Ñ']
    },
    rawBytes: {
      'ção': [...'ção'].map(char => ({ char, code: char.charCodeAt(0), hex: char.charCodeAt(0).toString(16) })),
      'João': [...'João'].map(char => ({ char, code: char.charCodeAt(0), hex: char.charCodeAt(0).toString(16) })),
      'Gonçalves': [...'Gonçalves'].map(char => ({ char, code: char.charCodeAt(0), hex: char.charCodeAt(0).toString(16) }))
    },
    timestamp: new Date().toISOString(),
    serverEncoding: 'UTF-8'
  };
  
  // Double-check we're sending proper JSON
  res.json(testData);
});

// Test endpoint that simulates corrupted data
router.get('/corruption-simulation', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  const corruptedData = {
    message: 'Corruption simulation test',
    examples: [
      {
        original: 'João',
        corrupted: 'Jo??o',
        description: 'Question mark corruption'
      },
      {
        original: 'Gonçalves',
        corrupted: 'Gon??alves', 
        description: 'Cedilla corruption'
      },
      {
        original: 'configuração',
        corrupted: 'configura????o',
        description: 'Multiple character corruption'
      },
      {
        original: 'António',
        corrupted: 'Ant??nio',
        description: 'O-acute corruption'
      }
    ],
    timestamp: new Date().toISOString()
  };
  
  res.json(corruptedData);
});

export default router;
