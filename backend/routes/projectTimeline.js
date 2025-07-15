import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /api/project-timeline/:projectName
router.get('/:projectName', async (req, res) => {
  const { projectName } = req.params;
  let db;
  
  try {
    db = await getDb();
    
    const result = await db.get(
      'SELECT start_date, end_date FROM projects WHERE project_name = ?',
      [projectName]
    );
    
    if (!result) {
      return res.json({ 
        startDate: null, 
        endDate: null,
        completionPercentage: 0 
      });
    }

    const startDate = new Date(result.start_date);
    const endDate = new Date(result.end_date);
    const currentDate = new Date();

    // Calculate completion percentage
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    const completionPercentage = Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100);

    res.json({
      startDate: result.start_date,
      endDate: result.end_date,
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
