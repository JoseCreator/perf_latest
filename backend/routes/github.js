import express from 'express';
import { Octokit } from '@octokit/rest';
import { getDb } from './db.js';
import axios from 'axios';

const router = express.Router();

// Initialize GitHub client
let octokit = null;

// Configure GitHub token
router.post('/configure', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'GitHub token is required' });
  }
  
  try {
    octokit = new Octokit({ auth: token });
    res.json({ message: 'GitHub configured successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to configure GitHub client' });
  }
});

// Get repository information
router.get('/repo/:owner/:repo', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo } = req.params;
  
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commit history
router.get('/commits/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const { page = 1, per_page = 10, sha, path, token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.listCommits({
      owner,
      repo,
      page: parseInt(page),
      per_page: parseInt(per_page),
      sha,
      path,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commit details
router.get('/commit/:owner/:repo/:sha', async (req, res) => {
  const { owner, repo, sha } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file content
router.get('/content/:owner/:repo/:path', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo, path } = req.params;
  const { ref } = req.query;
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare commits (get diff)
router.get('/compare/:owner/:repo/:base/:head', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo, base, head } = req.params;
  
  try {
    const { data } = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branches
router.get('/branches/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.listBranches({
      owner,
      repo,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's GitHub account from the database
router.get('/user-account', async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT github_account FROM utilizadores WHERE user_id = ?', [67]);
        
        // Log the retrieved user and account for debugging
        console.log('Database query result for user_id 67:', user);

        if (user && user.github_account) {
            let githubAccount = user.github_account;
            // Remove trailing slash if it exists
            if (githubAccount.endsWith('/')) {
                githubAccount = githubAccount.slice(0, -1);
            }
            console.log('Found and formatted GitHub account:', githubAccount);
            res.json({ github_account: githubAccount });
        } else {
            console.log('GitHub account not found for user_id 67.');
            res.status(404).json({ error: 'GitHub account not found for this user.' });
        }
    } catch (error) {
        console.error('Failed to fetch GitHub account:', error);
        res.status(500).json({ error: 'Failed to fetch GitHub account from database.' });
    }
});

// Search repositories
router.get('/search/repos', async (req, res) => {
  const { q, sort, order, per_page = 10, page = 1, token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const { data } = await githubClient.rest.search.repos({
      q,
      sort,
      order,
      per_page: parseInt(per_page),
      page: parseInt(page),
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis endpoint - analyze commit changes with intelligent insights
router.post('/analyze/:owner/:repo/:sha', async (req, res) => {
  const { owner, repo, sha } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    // Get commit details with file changes
    const { data: commitData } = await githubClient.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });
    
    // Analyze the commit changes intelligently
    const analysis = analyzeCommitChanges(commitData);
    
    res.json({
      commit: {
        message: commitData.commit.message,
        author: commitData.commit.author,
        stats: commitData.stats
      },
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Intelligent AI Analysis function
function analyzeCommitChanges(commitData) {
  const { files, stats, commit } = commitData;
  const message = commit.message.toLowerCase();
  
  // Analyze file changes
  const fileAnalysis = analyzeFiles(files);
  
  // Categorize the commit type
  const commitType = categorizeCommit(message, fileAnalysis);
  
  // Generate intelligent summary
  const summary = generateIntelligentSummary(commitType, fileAnalysis, stats, commit.message, files);
  
  return {
    type: commitType,
    summary,
    fileChanges: fileAnalysis,
    impact: assessImpact(stats, fileAnalysis),
    recommendations: generateRecommendations(commitType, fileAnalysis),
    buildDescription: generateBuildDescription(fileAnalysis, commitType, commit.message)
  };
}

function analyzeFiles(files) {
  const analysis = {
    newFiles: [],
    modifiedFiles: [],
    deletedFiles: [],
    technologies: new Set(),
    components: [],
    features: [],
    categories: new Set(),
    uiChanges: false,
    backendChanges: false,
    configChanges: false,
    testChanges: false
  };
  
  files.forEach(file => {
    const filename = file.filename.toLowerCase();
    const extension = filename.split('.').pop();
    
    // Categorize by status
    if (file.status === 'added') {
      analysis.newFiles.push(file.filename);
    } else if (file.status === 'modified') {
      analysis.modifiedFiles.push(file.filename);
    } else if (file.status === 'removed') {
      analysis.deletedFiles.push(file.filename);
    }
    
    // Detect technologies and changes
    detectTechnology(filename, extension, analysis);
    detectChangeType(filename, analysis);
    detectComponents(filename, file.patch, analysis);
  });
  
  return analysis;
}

function detectTechnology(filename, extension, analysis) {
  // Frontend technologies
  if (extension === 'tsx' || extension === 'jsx') {
    analysis.technologies.add('React');
    analysis.uiChanges = true;
  }
  if (extension === 'ts' || extension === 'js') {
    analysis.technologies.add('TypeScript/JavaScript');
  }
  if (extension === 'css' || filename.includes('tailwind') || filename.includes('style')) {
    analysis.technologies.add('CSS/Styling');
    analysis.uiChanges = true;
  }
  if (filename.includes('package.json')) {
    analysis.technologies.add('Dependencies');
    analysis.configChanges = true;
  }
  
  // Backend technologies
  if (filename.includes('api/') || filename.includes('routes/') || filename.includes('backend/')) {
    analysis.technologies.add('Backend API');
    analysis.backendChanges = true;
  }
  if (filename.includes('database') || filename.includes('.sql') || filename.includes('db.')) {
    analysis.technologies.add('Database');
    analysis.backendChanges = true;
  }
  
  // Testing
  if (filename.includes('test') || filename.includes('spec') || extension === 'test.js') {
    analysis.technologies.add('Testing');
    analysis.testChanges = true;
  }
  
  // Configuration
  if (filename.includes('config') || filename.includes('.env') || extension === 'json' || extension === 'yml') {
    analysis.technologies.add('Configuration');
    analysis.configChanges = true;
  }
}

function detectChangeType(filename, analysis) {
  // UI Components
  if (filename.includes('component') || filename.includes('page') || filename.includes('view')) {
    analysis.categories.add('UI Components');
  }
  
  // API routes
  if (filename.includes('route') || filename.includes('api') || filename.includes('endpoint')) {
    analysis.categories.add('API Development');
  }
  
  // Authentication
  if (filename.includes('auth') || filename.includes('login') || filename.includes('user')) {
    analysis.categories.add('Authentication');
  }
  
  // GitHub integration (specific to your project)
  if (filename.includes('github')) {
    analysis.categories.add('GitHub Integration');
  }
}

function detectComponents(filename, patch, analysis) {
  if (!patch) return;
  
  const patchLower = patch.toLowerCase();
  
  // Detect specific features being built
  if (patchLower.includes('function') || patchLower.includes('const ') || patchLower.includes('class ')) {
    analysis.features.push('New Functions/Components');
  }
  if (patchLower.includes('usestate') || patchLower.includes('useeffect')) {
    analysis.features.push('React Hooks');
  }
  if (patchLower.includes('axios') || patchLower.includes('fetch')) {
    analysis.features.push('API Integration');
  }
  if (patchLower.includes('button') || patchLower.includes('form') || patchLower.includes('input')) {
    analysis.features.push('UI Elements');
  }
}

function categorizeCommit(message, fileAnalysis) {
  if (message.includes('feat') || message.includes('add') || fileAnalysis.newFiles.length > 0) {
    return 'Feature Addition';
  }
  if (message.includes('fix') || message.includes('bug')) {
    return 'Bug Fix';
  }
  if (message.includes('refactor') || message.includes('improve')) {
    return 'Code Refactoring';
  }
  if (message.includes('style') || message.includes('ui') || fileAnalysis.uiChanges) {
    return 'UI/UX Update';
  }
  if (message.includes('test') || fileAnalysis.testChanges) {
    return 'Testing';
  }
  if (message.includes('config') || fileAnalysis.configChanges) {
    return 'Configuration';
  }
  return 'General Update';
}

function generateIntelligentSummary(commitType, fileAnalysis, stats, commitMessage, files) {
  let summary = `## 🔍 Commit Analysis\n\n`;
  
  // Main description
  summary += `**What was built:** `;
  
  if (commitType === 'Feature Addition') {
    if (fileAnalysis.categories.has('GitHub Integration')) {
      summary += `This commit builds a new GitHub integration feature. `;
    } else if (fileAnalysis.uiChanges) {
      summary += `This commit builds new user interface components and pages. `;
    } else if (fileAnalysis.backendChanges) {
      summary += `This commit builds new backend functionality and API endpoints. `;
    } else {
      summary += `This commit introduces new functionality to the application. `;
    }
  } else if (commitType === 'UI/UX Update') {
    summary += `This commit improves the user interface and user experience. `;
  } else if (commitType === 'Bug Fix') {
    summary += `This commit fixes bugs and resolves issues in the application. `;
  } else {
    summary += `This commit modifies existing functionality. `;
  }
  
  // Specific technologies involved
  if (fileAnalysis.technologies.size > 0) {
    summary += `Technologies involved: ${Array.from(fileAnalysis.technologies).join(', ')}.\n\n`;
  }
  
  // Detailed breakdown
  summary += `**📊 Changes Breakdown:**\n`;
  summary += `- **Files affected:** ${files.length} files\n`;
  if (fileAnalysis.newFiles.length > 0) {
    summary += `- **New files:** ${fileAnalysis.newFiles.length} (${fileAnalysis.newFiles.slice(0, 3).join(', ')}${fileAnalysis.newFiles.length > 3 ? '...' : ''})\n`;
  }
  if (fileAnalysis.modifiedFiles.length > 0) {
    summary += `- **Modified files:** ${fileAnalysis.modifiedFiles.length}\n`;
  }
  if (fileAnalysis.deletedFiles.length > 0) {
    summary += `- **Deleted files:** ${fileAnalysis.deletedFiles.length}\n`;
  }
  summary += `- **Code changes:** +${stats.additions} additions, -${stats.deletions} deletions\n\n`;
  
  // Categories and features
  if (fileAnalysis.categories.size > 0) {
    summary += `**🎯 Areas of Development:**\n`;
    Array.from(fileAnalysis.categories).forEach(category => {
      summary += `- ${category}\n`;
    });
    summary += `\n`;
  }
  
  if (fileAnalysis.features.length > 0) {
    summary += `**⚡ Technical Features:**\n`;
    [...new Set(fileAnalysis.features)].forEach(feature => {
      summary += `- ${feature}\n`;
    });
    summary += `\n`;
  }
  
  return summary;
}

function generateBuildDescription(fileAnalysis, commitType, commitMessage) {
  let description = '';
  
  if (fileAnalysis.categories.has('GitHub Integration')) {
    description = 'Built a comprehensive GitHub integration system allowing users to connect their GitHub accounts, search repositories, analyze commit history, and view code differences with AI-powered insights.';
  } else if (fileAnalysis.uiChanges && fileAnalysis.backendChanges) {
    description = 'Built a full-stack feature with both frontend user interface components and backend API endpoints working together.';
  } else if (fileAnalysis.uiChanges) {
    description = 'Built new user interface components including interactive elements, forms, and visual components to enhance user experience.';
  } else if (fileAnalysis.backendChanges) {
    description = 'Built backend infrastructure including API routes, database interactions, and server-side logic to support application functionality.';
  } else {
    description = `Built ${commitType.toLowerCase()} focused on ${Array.from(fileAnalysis.technologies).join(' and ')} improvements.`;
  }
  
  return description;
}

function assessImpact(stats, fileAnalysis) {
  const totalChanges = stats.additions + stats.deletions;
  
  let riskLevel = 'Low';
  let description = 'Small, focused changes with minimal risk.';
  
  if (totalChanges > 500) {
    riskLevel = 'High';
    description = 'Large-scale changes that may affect multiple system components.';
  } else if (totalChanges > 100) {
    riskLevel = 'Medium';
    description = 'Moderate changes that should be tested thoroughly.';
  }
  
  if (fileAnalysis.configChanges) {
    riskLevel = 'Medium';
    description += ' Configuration changes require careful deployment.';
  }
  
  return {
    riskLevel,
    description,
    totalChanges,
    newFeatures: fileAnalysis.newFiles.length,
    areasAffected: Array.from(fileAnalysis.categories)
  };
}

function generateRecommendations(commitType, fileAnalysis) {
  const recommendations = [];
  
  if (commitType === 'Feature Addition') {
    recommendations.push('Test the new functionality thoroughly before deployment');
    recommendations.push('Update documentation to reflect new features');
  }
  
  if (fileAnalysis.uiChanges) {
    recommendations.push('Verify UI responsiveness across different screen sizes');
    recommendations.push('Test user interactions and accessibility');
  }
  
  if (fileAnalysis.backendChanges) {
    recommendations.push('Run API tests to ensure endpoint functionality');
    recommendations.push('Check database migrations if applicable');
  }
  
  if (fileAnalysis.configChanges) {
    recommendations.push('Review environment configuration changes');
    recommendations.push('Ensure all team members have updated configurations');
  }
  
  return recommendations;
}

// POST /api/github/company-commits
// Body: { repos: [{ owner: string, name: string }], token: string, project_name: string }
router.post('/company-commits', async (req, res) => {
  const { repos, token, project_name } = req.body;
  console.log('🔔 /company-commits called with:', { reposCount: repos?.length, project_name });
  if (!repos || !Array.isArray(repos) || !token || !project_name) {
    console.log('❌ Missing required fields:', { repos, token, project_name });
    return res.status(400).json({ error: 'repos, token, and project_name required' });
  }
  const db = await getDb();
  let result = {};
  try {
    for (const repo of repos) {
      console.log('➡️ Processing repo:', repo);
      const commitsRes = await axios.get(`https://api.github.com/repos/${repo.owner}/${repo.name}/commits`, {
        headers: { Authorization: `token ${token}` },
        params: { per_page: 100 }
      });
      for (const commit of commitsRes.data) {
        const username = commit.author?.login || '';
        if (!username) continue;
        // Find user in DB
        const user = await db.get('SELECT * FROM utilizadores WHERE LOWER(REPLACE(github_account, "/", "")) = LOWER(REPLACE(?, "/", ""))', username.replace(/\//g, ''));
        if (!user) {
          console.log('⚠️ No user found for GitHub username:', username);
          continue;
        }
        if (!result[username]) result[username] = { user, commits: [] };
        // Simulate AI summary (replace with real AI call if needed)
        let aiSummary = `Commit: ${commit.commit.message}`;
        // Store in DB (upsert by sha+user+project)
        const project_id = 39; // Hardcode project_id for all commits
        
        try {
          // Check if this exact commit already exists
          const existingCommit = await db.get(`
            SELECT * FROM github_commit_summaries 
            WHERE commit_sha = ? AND user_id = ? AND project_id = ? AND commit_message = ? AND commit_date = ?`,
            [commit.sha, user.user_id, project_id, commit.commit.message, commit.commit.author.date]
          );

          if (!existingCommit) {
            try {
              // Only insert if the commit doesn't exist
              await db.run(`INSERT INTO github_commit_summaries (user_id, project_id, commit_sha, commit_message, commit_date, ai_summary, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [user.user_id, project_id, commit.sha, commit.commit.message, commit.commit.author.date, aiSummary]
              );
              console.log('✅ Inserted commit:', { user_id: user.user_id, project_name, sha: commit.sha });
            } catch (dbErr) {
              console.error('❌ DB insert error:', dbErr, { user_id: user.user_id, project_name, sha: commit.sha });
            }
          }

          result[username].commits.push({
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
            aiSummary
          });
        } catch (err) {
          console.error('❌ Error processing commit:', err, { username, sha: commit.sha });
        }
      }
    }
    // For each user, count commits
    const users = Object.values(result).map(u => ({
      user: u.user,
      commits: u.commits,
      commitCount: u.commits.length
    }));
    res.json(users);
  } catch (err) {
    console.error('❌ Outer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/github/commit-summaries?project_id=xxx
router.get('/commit-summaries', async (req, res) => {
  const { project_id } = req.query;
  console.log('🔍 Fetching commit summaries for project_id:', project_id);
  
  if (!project_id) {
    console.warn('⚠️ No project_id provided');
    return res.status(400).json({ error: 'project_id required' });
  }

  const db = await getDb();
  try {
    console.log('🔄 Running SQL query for project_id:', project_id);
    // Join with utilizadores and projects tables
    const rows = await db.all(`
      SELECT s.*, u.First_Name, u.Last_Name, u.github_account, p.project_name
      FROM github_commit_summaries s
      JOIN utilizadores u ON s.user_id = u.user_id
      JOIN projects p ON s.project_id = p.project_id
      WHERE s.project_id = ?
      ORDER BY s.commit_date DESC
    `, [project_id]);
    
    console.log('📊 Query results:', {
      rowCount: rows.length,
      firstRow: rows[0] ? {
        user_id: rows[0].user_id,
        name: `${rows[0].First_Name} ${rows[0].Last_Name}`,
        commit_sha: rows[0].commit_sha
      } : 'no rows'
    });
    // Group by user
    const grouped = {};
    console.log('🔄 Processing rows for grouping');
    
    for (const row of rows) {
      if (!grouped[row.user_id]) {
        console.log('👤 Creating new user group:', {
          user_id: row.user_id,
          name: `${row.First_Name} ${row.Last_Name}`,
          github: row.github_account
        });
        
        grouped[row.user_id] = {
          user: {
            user_id: row.user_id,
            First_Name: row.First_Name,
            Last_Name: row.Last_Name,
            github_account: row.github_account
          },
          commits: [],
          commitCount: 0
        };
      }
      
      grouped[row.user_id].commits.push({
        sha: row.commit_sha,
        message: row.commit_message,
        date: row.commit_date,
        aiSummary: row.ai_summary
      });
      grouped[row.user_id].commitCount++;
    }
    
    const result = Object.values(grouped);
    console.log('✅ Final result:', {
      userCount: result.length,
      users: result.map(u => ({
        id: u.user.user_id,
        name: `${u.user.First_Name} ${u.user.Last_Name}`,
        commitCount: u.commitCount
      }))
    });
    
    res.json(result);
  } catch (err) {
    console.error('❌ Error in commit-summaries:', {
      error: err.message,
      stack: err.stack,
      project_id
    });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/github/live-commits?owner=OWNER&repo=REPO&project_id=PROJECT_ID
router.get('/live-commits', async (req, res) => {
  const { owner, repo, project_id } = req.query;
  
  console.log('🔍 Live commits request:', { owner, repo, project_id });
  
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo parameters' });
  }

  // Initialize teamMembers at the top level
  let teamMembers = [];

  try {
    // Get team members for the project if project_id is provided
    if (project_id) {
      const db = await getDb();
      try {
        // Get project name from project_id
        const project = await db.get('SELECT project_name FROM projects WHERE project_id = ?', [project_id]);
        if (project) {
          // Get team members for this project
          const members = await db.all(`
            SELECT DISTINCT u.user_id, u.First_Name, u.Last_Name, u.github_account
            FROM utilizadores u
            JOIN timesheet t ON u.user_id = t.user_id
            JOIN projects p ON t.project_id = p.project_id
            WHERE p.project_id = ? AND u.github_account IS NOT NULL AND u.github_account != ''
          `, [project_id]);
          teamMembers = members;
          console.log(`👥 Found ${teamMembers.length} team members with GitHub accounts`);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      } finally {
        await db.close();
      }
    }

    // Use GitHub token if available for higher rate limits
    const headers = process.env.GITHUB_TOKEN 
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {};

    console.log('📡 Fetching commits from GitHub API...');
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      { 
        headers,
        params: { per_page: 10 } // Limit to last 10 commits
      }
    );

    console.log(`✅ Fetched ${response.data.length} commits from GitHub`);

    // Transform GitHub commits to match our expected format
    const transformedCommits = teamMembers.map(member => {
      // Clean up GitHub account (remove trailing slash)
      const cleanGithubAccount = member.github_account?.replace(/\/$/, '').toLowerCase();
      
      // Filter commits by this user's GitHub account
      const userCommits = response.data.filter(commit => {
        const authorLogin = commit.author?.login?.toLowerCase();
        const authorEmail = commit.commit?.author?.email?.toLowerCase();
        const commitAuthorName = commit.commit?.author?.name?.toLowerCase();
        
        // Try multiple matching strategies
        const matchesLogin = authorLogin === cleanGithubAccount;
        const matchesEmail = authorEmail?.includes(cleanGithubAccount);
        const matchesName = commitAuthorName === cleanGithubAccount;
        
        console.log(`🔍 Matching commit ${commit.sha.substring(0, 7)} for user ${member.First_Name}:`, {
          cleanGithubAccount,
          authorLogin,
          authorEmail,
          commitAuthorName,
          matchesLogin,
          matchesEmail,
          matchesName,
          finalMatch: matchesLogin || matchesEmail || matchesName
        });
        
        return matchesLogin || matchesEmail || matchesName;
      });

      console.log(`📊 User ${member.First_Name} (${cleanGithubAccount}): ${userCommits.length} commits found`);

      return {
        user: {
          user_id: member.user_id,
          First_Name: member.First_Name,
          Last_Name: member.Last_Name,
          github_account: cleanGithubAccount
        },
        commits: userCommits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author.date,
          url: commit.html_url,
          aiSummary: `Commit by ${commit.commit.author.name} on ${new Date(commit.commit.author.date).toLocaleDateString()}`
        })),
        commitCount: userCommits.length
      };
    }).filter(user => user.commitCount > 0); // Only include users with commits

    console.log(`📊 Transformed commits for ${transformedCommits.length} users`);
    res.json(transformedCommits);

  } catch (error) {
    console.error('❌ Error fetching live commits:', error.message);
    
    // Return mock data if GitHub API fails
    const mockData = teamMembers.length > 0 ? teamMembers.map(member => ({
      user: {
        user_id: member.user_id,
        First_Name: member.First_Name,
        Last_Name: member.Last_Name,
        github_account: member.github_account
      },
      commits: [
        {
          sha: 'mock123',
          message: 'Initial commit',
          date: new Date().toISOString(),
          url: '#',
          aiSummary: 'Mock commit data - GitHub API unavailable'
        }
      ],
      commitCount: 1
    })) : [
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
    
    res.json(mockData);
  }
});

export default router;
