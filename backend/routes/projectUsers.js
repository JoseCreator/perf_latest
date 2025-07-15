import express from 'express';
const router = express.Router();
import { getDb } from './db.js';

// GET /:projectName
router.get('/:projectName', async (req, res) => {
  const { projectName } = req.params;
  let db;
  try {
    db = await getDb();
    console.log('Incoming projectName:', projectName);

    // Debug: Get all projects first
    const allProjects = await db.all('SELECT project_id, project_name FROM projects');
    console.log('All projects:', allProjects);

    // 1. Get project_id using exact name match
    const projectResult = await db.get('SELECT project_id FROM projects WHERE project_name = ?', [projectName]);
    if (!projectResult) {
      console.log('Project not found:', projectName);
      return res.status(404).json({ error: 'Project not found' });
    }
    const projectId = projectResult.project_id;
    console.log('Found Project ID:', projectId);

    // 2. Get user_ids from timesheet
    const userIdsResult = await db.all(
      'SELECT DISTINCT user_id FROM timesheet WHERE project_id = ? AND hours > 0', 
      [projectId]
    );
    console.log('Timesheet entries found:', userIdsResult);
    
    if (!userIdsResult.length) {
      console.log('No users found for project:', projectId);
      return res.json([]);
    }
    const userIds = userIdsResult.map(row => row.user_id);
    console.log('Extracted User IDs:', userIds);

    // 3. Get user details
    const placeholders = userIds.map(() => '?').join(',');
    const usersResult = await db.all(
      `SELECT First_Name, Last_Name, user_id 
       FROM utilizadores 
       WHERE user_id IN (${placeholders}) 
       AND active = 1`,
      userIds
    );
    console.log('Final users result:', usersResult);
    res.json(usersResult);

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    if (db) {
      await db.close();
    }
  }
});

export default router;
