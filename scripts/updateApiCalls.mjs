#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URL replacements
const replacements = [
  {
    from: "axios.get('http://localhost:4000/api/users/user-available-hours'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.userAvailableHours)"
  },
  {
    from: "axios.get('http://localhost:4000/api/information/information'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.information)"
  },
  {
    from: "axios.get('http://localhost:4000/api/information/user-id'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.userId)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/by-user'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.clientsByUser)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/projects-by-user'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.projectsByUser)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/group-id'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.groupId)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/client-id'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.clientId)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/category-id'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.categoryId)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/project-id'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.projectId)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/validate-timesheet'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.validateTimesheet)"
  },
  {
    from: "axios.post('http://localhost:4000/api/clients/timesheet'",
    to: "axios.post(createApiUrl(apiConfig.endpoints.timesheet)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/project-people-hours'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.projectPeopleHours)"
  },
  {
    from: "axios.get('http://localhost:4000/api/clients/project-hours-breakdown'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.projectHoursBreakdown)"
  },
  {
    from: "axios.get('http://localhost:4000/api/absences/user-month-hours'",
    to: "axios.get(createApiUrl(apiConfig.endpoints.userMonthHours)"
  }
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Add import if it doesn't exist and file contains axios calls
    if (content.includes('axios.') && content.includes('localhost:4000') && !content.includes('createApiUrl')) {
      if (content.includes('import axios from "axios";')) {
        content = content.replace(
          'import axios from "axios";',
          'import axios from "axios";\nimport { createApiUrl, apiConfig } from "../utils/apiConfig";'
        );
        hasChanges = true;
      } else if (content.includes("import axios from 'axios';")) {
        content = content.replace(
          "import axios from 'axios';",
          "import axios from 'axios';\nimport { createApiUrl, apiConfig } from '../utils/apiConfig';"
        );
        hasChanges = true;
      }
    }
    
    // Apply replacements
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replaceAll(replacement.from, replacement.to);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Find and update all TypeScript/JavaScript files in src
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      updateFile(filePath);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Updating API calls in:', srcDir);
walkDir(srcDir);
console.log('API update complete!');
