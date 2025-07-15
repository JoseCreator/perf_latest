import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /api/user-roles/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  let db;
  
  try {
    db = await getDb();
    const result = await db.get(
      'SELECT role FROM utilizadores WHERE user_id = ?',
      [userId]
    );
    
    if (!result) {
      return res.json({ role: 'N/A' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (db) {
      await db.close();
    }
  }
});

export default router;
