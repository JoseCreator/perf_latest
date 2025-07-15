// Production backend URL - hardcoded to ensure it works
// Force correct URL and prevent underscore variations
let envUrl = import.meta.env.VITE_API_URL;
if (envUrl && envUrl.includes('pbe_duarte')) {
  console.warn('🚨 FIXING URL: Detected underscore in URL, replacing with hyphen');
  envUrl = envUrl.replace('pbe_duarte', 'pbe-duarte');
}
const API_BASE_URL = envUrl || 'https://pbe-duarte.onrender.com';

// Debug logging to see what URL is being used
console.log('🔧 API Configuration Debug:');
console.log('VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('Final API_BASE_URL (hardcoded):', API_BASE_URL);
console.log('Environment Mode:', import.meta.env.MODE);

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {    
    // Project routes
    allProjects: '/api/projects',
    projectsWithGithub: '/api/projects/with-github',
    projectGithubInfo: '/api/projects/github-info', // expects /:projectId
    projectTotalHours: '/api/project-total-hours',
    projectTimeline: '/api/project-timeline',
    projectCost: '/api/project-cost',
    projectBudget: '/api/project-budget',
    projectRiskByMonth: '/api/project-risk-by-month',
    // Admin routes
    adminClients: '/api/admin/clients',
    adminProjects: '/api/admin/projects',
    adminUsers: '/api/admin/users',
    // User routes
    userRoles: '/api/user-roles',
    userHours: '/api/user-hours',
    login: '/api/users/login',
    register: '/api/users/register',
    userAvailableHours: '/api/users/user-available-hours',
    changePassword: '/api/users/change-password',
      // Information routes
    information: '/api/information/information',
    userId: '/api/information/user-id',
    userTimesheet: '/api/information/user-timesheet',
    groupByUserId: '/api/information/group-by-user-id',
    
    // Client routes
    clients: '/api/clients',
    clientsByUser: '/api/clients/by-user',
    groups: '/api/clients/groups',
    categories: '/api/clients/categories',
    validateTimesheet: '/api/clients/validate-timesheet',
    timesheet: '/api/clients/timesheet',
    groupId: '/api/clients/group-id',
    clientId: '/api/clients/client-id',
    categoryId: '/api/clients/category-id',
    projectsByUser: '/api/clients/projects-by-user',
    projectId: '/api/clients/project-id',
    projectPeopleHours: '/api/clients/project-people-hours',
    projectHoursBreakdown: '/api/clients/project-hours-breakdown',
      // Absence routes
    absences: '/api/absences',
    userAbsences: '/api/absences/user-absences',
    userMonthHours: '/api/absences/user-month-hours',
    projectUsers: '/api/project-users/', // expects /api/project-users/:projectName
    
    // GitHub routes
    githubConfigure: '/api/github/configure',
    githubSearchRepos: '/api/github/search/repos',
    githubRepo: '/api/github/repo',
    githubBranches: '/api/github/branches',
    githubCommits: '/api/github/commits',
    githubCommit: '/api/github/commit',
    githubAnalyze: '/api/github/analyze',
    githubUserAccount: '/api/github/user-account',
    githubUserByAccount: '/api/users/by-github/',
    githubCompanyCommits: '/api/github/company-commits',
    githubCommitSummaries: '/api/github/commit-summaries',
    githubLiveCommits: '/api/github/live-commits'
  }
};

// Absence API Functions
export const absencesApi = {
  getAllAbsences: async () => {
    const response = await fetch(`${API_BASE_URL}/api/absences`);
    if (!response.ok) throw new Error('Failed to fetch absences');
    return response.json();
  },

  createAbsence: async (absenceData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/absences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(absenceData)
    });
    if (!response.ok) throw new Error('Failed to create absence');
    return response.json();
  },

  updateAbsence: async (id: number, absenceData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/absences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(absenceData)
    });
    if (!response.ok) throw new Error('Failed to update absence');
    return response.json();
  },

  deleteAbsence: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/absences/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete absence');
    return response.json();
  }
};

export const createApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
