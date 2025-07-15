import { getDb } from './routes/db.js';
import axios from 'axios';

async function debugGitHubCommits() {
  console.log('🔍 Debugging GitHub commits for project 39...');
  
  const db = await getDb();
  try {
    // Check team members with GitHub accounts
    const members = await db.all(`
      SELECT DISTINCT u.user_id, u.First_Name, u.Last_Name, u.github_account
      FROM utilizadores u
      JOIN timesheet t ON u.user_id = t.user_id
      JOIN projects p ON t.project_id = p.project_id
      WHERE p.project_id = 39 AND u.github_account IS NOT NULL AND u.github_account != ''
    `);
    console.log('👥 Team members with GitHub accounts:', JSON.stringify(members, null, 2));
    
    // Check all team members for this project (even without GitHub accounts)
    const allMembers = await db.all(`
      SELECT DISTINCT u.user_id, u.First_Name, u.Last_Name, u.github_account
      FROM utilizadores u
      JOIN timesheet t ON u.user_id = t.user_id
      JOIN projects p ON t.project_id = p.project_id
      WHERE p.project_id = 39
    `);
    console.log('👥 All team members for project 39:', JSON.stringify(allMembers, null, 2));
    
    // Test GitHub API call
    console.log('📡 Testing GitHub API call...');
    const response = await axios.get('https://api.github.com/repos/soudua/Perform_render/commits', {
      params: { per_page: 5 }
    });
    
    console.log(`✅ GitHub API returned ${response.data.length} commits`);
    console.log('📋 First few commits:');
    response.data.slice(0, 3).forEach((commit, index) => {
      console.log(`  ${index + 1}. ${commit.sha.substring(0, 7)} - ${commit.commit.message.substring(0, 50)}...`);
      console.log(`     Author: ${commit.commit.author.name} (${commit.commit.author.email})`);
      console.log(`     GitHub User: ${commit.author?.login || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

debugGitHubCommits();
