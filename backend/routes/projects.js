import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET /api/projects - returns all project names
router.get('/', async (req, res) => {
  const db = await getDb();
  try {
    const projects = await db.all('SELECT project_name FROM projects ORDER BY project_name');
    res.json(projects.map(p => p.project_name));
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  } finally {
    await db.close();
  }
});

// GET /api/projects/with-github - returns project names with associated GitHub repositories
router.get('/with-github', async (req, res) => {
  const db = await getDb();
  try {
    const projects = await db.all("SELECT project_name FROM projects WHERE GitHub_project IS NOT NULL AND GitHub_project != ''");
    res.json(projects.map(p => p.project_name));
  } catch (error) {
    console.error('Error fetching projects with GitHub:', error);
    res.status(500).json({ error: 'Failed to fetch projects with GitHub' });
  } finally {
    await db.close();
  }
});

// GET /api/projects/github-info/:projectId - returns GitHub repo info for a project
router.get('/github-info/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const db = await getDb();
  try {
    const project = await db.get("SELECT project_name, GitHub_project FROM projects WHERE project_id = ?", [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (!project.GitHub_project) {
      return res.status(404).json({ error: 'No GitHub repository associated with this project' });
    }
    
    // Parse GitHub_project field - assuming it contains owner/repo format
    const githubProject = project.GitHub_project;
    let owner, repo;
    
    if (githubProject.includes('/')) {
      [owner, repo] = githubProject.split('/');
    } else {
      // If it's just the repo name, we'll need to provide a default owner
      owner = 'your-org'; // TODO: Configure this properly
      repo = githubProject;
    }
    
    res.json({
      project_name: project.project_name,
      github_project: githubProject,
      owner,
      repo
    });
  } catch (error) {
    console.error('Error fetching GitHub info for project:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub info' });
  } finally {
    await db.close();
  }
});

export default router;
