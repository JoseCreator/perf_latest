import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /api/project-budget/:projectName
router.get('/:projectName', async (req, res) => {
  const { projectName } = req.params;
  let db;
  
  try {
    db = await getDb();
    
    // Get total_cost (budget) from projects
    const projectResult = await db.get(
      'SELECT total_cost FROM projects WHERE project_name = ?',
      [projectName]
    );
    
    if (!projectResult) {
      return res.json({ 
        budget: 0,
        currentCost: 0,
        completionPercentage: 0 
      });
    }

    // Get current cost from timesheet and rates
    const costResult = await db.all(`
      SELECT 
        t.user_id,
        SUM(t.hours) as total_hours,
        u.rate_id as rate
      FROM timesheet t
      JOIN utilizadores u ON t.user_id = u.user_id
      WHERE t.project_id = (
        SELECT project_id FROM projects WHERE project_name = ?
      )
      GROUP BY t.user_id
    `, [projectName]);

    // Calculate total current cost
    const currentCost = costResult.reduce((sum, user) => {
      const userCost = (user.total_hours || 0) * (user.rate || 0);
      return sum + userCost;
    }, 0);

    // Calculate completion percentage
    const budget = projectResult.total_cost || 0;
    const completionPercentage = budget > 0 ? Math.min((currentCost / budget) * 100, 100) : 0;
    
    res.json({
      budget,
      currentCost,
      completionPercentage: Math.round(completionPercentage)
    });
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
