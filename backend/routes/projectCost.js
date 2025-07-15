import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /api/project-cost/:projectName
router.get('/:projectName', async (req, res) => {
  const { projectName } = req.params;
  let db;
  
  try {
    db = await getDb();
    
    // First get project_id
    const projectResult = await db.get(
      'SELECT project_id FROM projects WHERE project_name = ?',
      [projectName]
    );
    
    if (!projectResult) {
      return res.json({ totalCost: 0 });
    }

    // Get user hours and rates in one query
    const costResult = await db.all(`
      SELECT 
        t.user_id,
        SUM(t.hours) as total_hours,
        u.rate_id as rate
      FROM timesheet t
      JOIN utilizadores u ON t.user_id = u.user_id
      WHERE t.project_id = ?
      GROUP BY t.user_id
    `, [projectResult.project_id]);

    // Calculate total cost
    const totalCost = costResult.reduce((sum, user) => {
      const userCost = (user.total_hours || 0) * (user.rate || 0);
      return sum + userCost;
    }, 0);
    
    res.json({ totalCost });
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
