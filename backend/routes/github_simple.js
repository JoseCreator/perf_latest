import express from 'express';
import axios from 'axios';
import { getDb } from './db.js';

const router = express.Router();

// GET /api/github/live-commits?owner=OWNER&repo=REPO&project_id=PROJECT_ID
router.get('/live-commits', async (req, res) => {
  const { owner, repo, project_id } = req.query;
  
  console.log('🔍 Live commits request:', { owner, repo, project_id });
  
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo parameters' });
  }

  try {
    // Return mock data for now to test the endpoint
    const mockData = [
      {
        user: {
          user_id: 1,
          First_Name: 'Demo',
          Last_Name: 'User',
          github_account: 'demo_user'
        },
        commits: [
          {
            sha: 'demo123',
            message: 'Demo commit for testing',
            date: new Date().toISOString(),
            url: '#',
            aiSummary: 'Demo commit data for testing purposes'
          }
        ],
        commitCount: 1
      }
    ];
    
    console.log('✅ Returning mock commit data');
    res.json(mockData);
    
  } catch (error) {
    console.error('❌ Error in live-commits:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
