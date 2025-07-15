import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /api/user-hours/:projectName/:userId
router.get('/:projectName/:userId', async (req, res) => {
  const { projectName, userId } = req.params;
  let db;
  
  try {
    db = await getDb();
    
    // First get project_id
    const projectResult = await db.get(
      'SELECT project_id FROM projects WHERE project_name = ?',
      [projectName]
    );
    
    if (!projectResult) {
      return res.json({ totalHours: 0 });
    }

    // Then get sum of hours for this user in this project
    const hoursResult = await db.get(
      'SELECT SUM(hours) as totalHours FROM timesheet WHERE project_id = ? AND user_id = ?',
      [projectResult.project_id, userId]
    );
    
    res.json({ 
      totalHours: hoursResult ? hoursResult.totalHours || 0 : 0 
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
