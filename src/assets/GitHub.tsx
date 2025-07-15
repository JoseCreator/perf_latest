import { useState, useEffect } from 'react';
import { Search, GitBranch, GitCommit, Calendar, User, FileCode, Star, Eye, GitFork, ChevronRight, ChevronDown, RefreshCw, Settings, Bot, Diff, Building2 } from 'lucide-react';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    raw_url: string;
  }>;
}

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

function GitHub() {
  console.log('🚀 GitHub component is loading!');
  
  const [token, setToken] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [companyRepositories, setCompanyRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [activeTab, setActiveTab] = useState<'commits' | 'files' | 'diff' | 'ai-summary'>('commits');
  const [searchTab, setSearchTab] = useState<'empresa' | 'procurar'>('procurar');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState<boolean>(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [, setCompanyCommitsByUser] = useState<any[]>([]);

  // Handle mouse enter for logout popup
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowLogoutPopup(true);
  };

  // Handle mouse leave for logout popup with delay
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowLogoutPopup(false);
    }, 200); // 200ms delay
    setHoverTimeout(timeout);
  };

  // Fetch company repositories
  const fetchCompanyRepositories = async () => {
    setLoading(true);
    setError('');
    try {
      // First, get the github_account from the database
      const userResponse = await axios.get(createApiUrl(apiConfig.endpoints.githubUserAccount));
      const githubAccount = userResponse.data.github_account;

      if (githubAccount) {
        // Then, search for repositories from that user
        const repoResponse = await axios.get(createApiUrl(apiConfig.endpoints.githubSearchRepos), {
          params: { q: `user:${githubAccount}`, token }
        });
        setCompanyRepositories(repoResponse.data.items || []);
      } else {
        setError('GitHub account for user not found.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch company repositories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company commits by user
  // Fetch company commits by user and store in DB
  const fetchCompanyCommits = async (repos: Repository[]) => {
    if (!token || !repos.length) return;
    try {
      // Get project name from PerformClientes localStorage (if available)
      let projectName = localStorage.getItem('selectedProject') || '';
      if (!projectName && window.location.hash.includes('project=')) {
        projectName = decodeURIComponent(window.location.hash.split('project=')[1].split('&')[0]);
      }
      // If projectName is still not set, do nothing (wait for user to click the button to set it)
      if (!projectName) {
        // Do not show modal automatically
        return;
      }
      const repoList = repos.map(r => ({ owner: r.owner.login, name: r.name }));
      const response = await axios.post(createApiUrl(apiConfig.endpoints.githubCompanyCommits), {
        repos: repoList,
        token,
        project_name: projectName
      });
      setCompanyCommitsByUser(response.data);
      // No longer store in localStorage; data is in DB
    } catch (err: any) {
      setCompanyCommitsByUser([]);
    }
  };
  // State for project name prompt
  const [showProjectNamePrompt, setShowProjectNamePrompt] = useState<boolean>(false);
  const [manualProjectName, setManualProjectName] = useState<string>('');

  // Handler for confirming project name
  const handleProjectNameConfirm = async () => {
    if (!manualProjectName.trim()) return;
    localStorage.setItem('selectedProject', manualProjectName);
    setShowProjectNamePrompt(false);
    setManualProjectName('');
    // Re-run fetchCompanyCommits with the new project name
    await fetchCompanyCommits(companyRepositories);
  };

  // Load saved token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    if (searchTab === 'empresa' && isConfigured) {
      fetchCompanyRepositories();
    }
  }, [searchTab, isConfigured]);

  useEffect(() => {
    if (searchTab === 'empresa' && isConfigured && companyRepositories.length > 0) {
      fetchCompanyCommits(companyRepositories);
    }
    // eslint-disable-next-line
  }, [searchTab, isConfigured, companyRepositories]);

  // Handle logout
  const handleLogout = () => {
    setIsConfigured(false);
    setToken('');
    setCurrentRepo(null);
    setRepositories([]);
    setCommits([]);
    setSelectedCommit(null);
    localStorage.removeItem('github_token');
    setShowLogoutPopup(false);
  };

  // Configure GitHub token
  const configureGitHub = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(createApiUrl(apiConfig.endpoints.githubConfigure), { token });
      setIsConfigured(true);
      setError('');
      localStorage.setItem('github_token', token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to configure GitHub');
    } finally {
      setLoading(false);
    }
  };

  // Search repositories
  const searchRepositories = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(createApiUrl(apiConfig.endpoints.githubSearchRepos), {
        params: { q: searchQuery, token }
      });
      
      setRepositories(response.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search repositories');
    } finally {
      setLoading(false);
    }
  };

  // Load repository data
  const loadRepository = async (repo: Repository) => {
    setCurrentRepo(repo);
    setLoading(true);
    setError('');

    try {
      // Load branches
      const branchResponse = await axios.get(createApiUrl(`${apiConfig.endpoints.githubBranches}/${repo.owner.login}/${repo.name}`), {
        params: { token }
      });
      setBranches(branchResponse.data);

      // Load commits
      await loadCommits(repo.owner.login, repo.name, selectedBranch);
    } catch (err: any) {
      setError('Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

  // Load commits for a branch
  const loadCommits = async (owner: string, repo: string, branch: string = 'main') => {
    setLoading(true);
    
    try {
      const response = await axios.get(createApiUrl(`${apiConfig.endpoints.githubCommits}/${owner}/${repo}`), {
        params: { sha: branch, per_page: 20, token }
      });
      
      setCommits(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  };

  // Load commit details
  const loadCommitDetails = async (commit: Commit) => {
    if (!currentRepo) return;

    setSelectedCommit(commit);
    setLoading(true);
    
    try {
      const response = await axios.get(createApiUrl(`${apiConfig.endpoints.githubCommit}/${currentRepo.owner.login}/${currentRepo.name}/${commit.sha}`), {
        params: { token }
      });
      setSelectedCommit(response.data);
    } catch (err: any) {
      setError('Failed to load commit details');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI summary with intelligent analysis
  const generateAISummary = async () => {
    if (!selectedCommit || !currentRepo) return;

    setSummaryLoading(true);
    setAiSummary('');

    try {
      const response = await axios.post(
        createApiUrl(`${apiConfig.endpoints.githubAnalyze}/${currentRepo.owner.login}/${currentRepo.name}/${selectedCommit.sha}`),
        {},
        { params: { token } }
      );

      if (response.data.analysis) {
        setAiSummary(response.data.analysis.summary);
      } else {
        throw new Error('No analysis data received');
      }
    } catch (err: any) {
      console.error('AI Analysis error:', err);
      // Fallback to simulated analysis
      const mockSummary = generateFallbackSummary(selectedCommit);
      setAiSummary(mockSummary);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fallback summary generator
  const generateFallbackSummary = (commit: Commit) => {
    const message = commit.commit.message.toLowerCase();
    const files = commit.files || [];
    
    let summary = `## 🔍 Commit Analysis\n\n`;
    
    if (message.includes('github') || files.some(f => f.filename.toLowerCase().includes('github'))) {
      summary += `**What was built:** This commit builds GitHub integration functionality, allowing users to connect their GitHub accounts and analyze repository data.\n\n`;
    } else if (message.includes('add') || message.includes('feat')) {
      summary += `**What was built:** This commit introduces new functionality to the application.\n\n`;
    } else if (message.includes('fix')) {
      summary += `**What was built:** This commit fixes bugs and resolves issues in the application.\n\n`;
    } else {
      summary += `**What was built:** This commit modifies existing functionality in the application.\n\n`;
    }
    
    summary += `**📊 Changes Summary:**\n`;
    summary += `- **Files affected:** ${files.length} files\n`;
    summary += `- **Code changes:** +${commit.stats?.additions || 0} additions, -${commit.stats?.deletions || 0} deletions\n\n`;
    
    if (files.length > 0) {
      const newFiles = files.filter(f => f.status === 'added');
      const modifiedFiles = files.filter(f => f.status === 'modified');
      
      if (newFiles.length > 0) {
        summary += `**✨ New files created:** ${newFiles.map(f => f.filename).join(', ')}\n\n`;
      }
      
      if (modifiedFiles.length > 0) {
        summary += `**🔧 Modified files:** ${modifiedFiles.slice(0, 5).map(f => f.filename).join(', ')}${modifiedFiles.length > 5 ? '...' : ''}\n\n`;
      }
    }
    
    summary += `**🎯 Impact:** This change affects the codebase with ${commit.stats?.total || 0} total modifications and should be tested thoroughly before deployment.`;
    
    return summary;
  };

  // Toggle file expansion in diff view
  const toggleFileExpansion = (filename: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedFiles(newExpanded);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render diff lines
  const renderDiff = (patch: string) => {
    const lines = patch.split('\n');
    return lines.map((line, index) => {
      let className = 'px-4 py-1 font-mono text-sm';
      if (line.startsWith('+') && !line.startsWith('+++')) {
        className += ' bg-green-100 text-green-800 border-l-4 border-green-500';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        className += ' bg-red-100 text-red-800 border-l-4 border-red-500';
      } else if (line.startsWith('@@')) {
        className += ' bg-blue-100 text-blue-800 font-semibold';
      } else {
        className += ' bg-gray-50 text-gray-700';
      }
      
      return (
        <div key={index} className={className}>
          {line || ' '}
        </div>
      );
  });
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-[#5176a3] rounded-2xl shadow-2xl p-8 ">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-black">GitHub Integration</h1>
              <p className="text-white font-semibold mt-2">Connect your GitHub account to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-white font-medium mt-1">
                  Create a token at GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <button
                onClick={configureGitHub}
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Configure GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Project Name Prompt Modal */}
      {showProjectNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Enter Project Name</h2>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project name for GitHub commit storage"
              value={manualProjectName}
              onChange={e => setManualProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleProjectNameConfirm(); }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
                onClick={() => { setShowProjectNamePrompt(false); setManualProjectName(''); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 rounded-md text-white font-bold hover:bg-blue-700"
                onClick={handleProjectNameConfirm}
                disabled={!manualProjectName.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-[#5b92da] shadow-sm border-b rounded-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <GitBranch className="h-8 w-8 text-gray-50 mr-3" />
              <h1 className="text-xl font-semibold text-gray-50">GitHub Integration</h1>
            </div>
            <div className="relative">
              <button
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="text-gray-50 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              {/* Custom Logout Popup */}
              {showLogoutPopup && (
                <div 
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="text-sm text-gray-700 mb-3">
                    Are you sure you want to log out of your existing GitHub key?
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-4'>
  <div className='flex justify-center gap-3'>
    <div className='flex'> {/*Box */}
      <div className='w-[70px] lg:w-[180px] md:w-[100px] sm:w-[80px] h-[70px] lg:h-[150px] md:h-[120px] sm:h-[80px] bg-blue-400 rounded-2xl border-1 shadow-lg text-white text-[10px] sm:text-[12px] md:text-[12px] lg:text-[17px]  font-bold flex justify-center items-center flex-col'>
        <div>Reposítorio</div>
        <FileCode size={32} />
      </div>
    </div>
    <div className='flex items-center'> {/*Arrow */}
      <div className="w-6 h-[15px] bg-blue-500" />
      <div className="w-0 h-0 border-t-[20px] border-b-[20px] border-l-[20px] border-t-transparent border-b-transparent border-l-blue-500" />
    </div>
    <div className='flex'> {/*Box */}
      <div className='w-[70px] lg:w-[180px] md:w-[100px] sm:w-[80px] h-[70px] lg:h-[150px] md:h-[120px] sm:h-[80px] bg-blue-400 rounded-2xl border-1 shadow-lg text-white text-[10px] sm:text-[12px] md:text-[12px] lg:text-[17px]  font-bold flex justify-center items-center flex-col'>
        <div>Commit</div>
        <GitCommit size={32} />
      </div>
    </div>
    <div className='flex items-center'> {/*Arrow */}
      <div className="w-6 h-[15px] bg-blue-500" />
      <div className="w-0 h-0 border-t-[20px] border-b-[20px] border-l-[20px] border-t-transparent border-b-transparent border-l-blue-500" />
    </div>
    <div className='flex'> {/*Box */}
      <div className='w-[70px] lg:w-[180px] md:w-[100px] sm:w-[80px] h-[70px] lg:h-[150px] md:h-[120px] sm:h-[80px] bg-blue-400 rounded-2xl border-1 shadow-lg text-white text-[10px] sm:text-[12px] md:text-[12px] lg:text-[17px]  font-bold flex justify-center items-center flex-col'>
        <div>AI</div>
        <Bot size={32} />
      </div>
    </div>
  </div>
</div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentRepo ? (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Repositories</h2>
              <div className='flex justify-end'>
              <button
                    className="mb-4 border-2 border-blue-600 text-gray-500 px-4 py-2 rounded-md hover:bg-blue-600 hover:text-white font-bold"
                    onClick={() => setShowProjectNamePrompt(true)}
                  >
                    Save Project
                  </button>

                  </div>
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'procurar', label: 'Procurar', icon: Search },
                    { id: 'empresa', label: 'Empresa', icon: Building2 }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSearchTab(tab.id as 'empresa' | 'procurar')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        searchTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {searchTab === 'procurar' && (
                <div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchRepositories()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search repositories..."
                      />
                    </div>
                    <button
                      onClick={searchRepositories}
                      disabled={loading}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {searchTab === 'empresa' && (
                <div>
                  
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : companyRepositories.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm mt-6">
                      <div className="divide-y">
                        {companyRepositories.map((repo) => (
                          <div
                            key={repo.id}
                            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => loadRepository(repo)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                                    {repo.full_name}
                                  </h4>
                                  {repo.language && (
                                    <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      {repo.language}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mt-1">{repo.description}</p>
                                <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 mr-1" />
                                    {repo.stargazers_count}
                                  </div>
                                  <div className="flex items-center">
                                    <GitFork className="h-4 w-4 mr-1" />
                                    {repo.forks_count}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(repo.updated_at)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No company repositories found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Repository Results */}
            {searchTab === 'procurar' && repositories.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                </div>
                <div className="divide-y">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => loadRepository(repo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                              {repo.full_name}
                            </h4>
                            {repo.language && (
                              <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{repo.description}</p>
                          <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1" />
                              {repo.stargazers_count}
                            </div>
                            <div className="flex items-center">
                              <GitFork className="h-4 w-4 mr-1" />
                              {repo.forks_count}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(repo.updated_at)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Repository Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={currentRepo.owner.avatar_url}
                    alt={currentRepo.owner.login}
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentRepo.full_name}</h2>
                    <p className="text-gray-600">{currentRepo.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentRepo(null)}
                  className="text-white h-14 w-30 md:w-40 lg:w-40 sm:w-20 sm:h-20 font-bold bg-[#428ae2] rounded-3xl border-2 hover:bg-[#54b2ff]"
                >
                  Back to Search
                </button>
              </div>
              
              <div className="flex items-center mt-4 space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  {currentRepo.stargazers_count} stars
                </div>
                <div className="flex items-center">
                  <GitFork className="h-4 w-4 mr-1" />
                  {currentRepo.forks_count} forks
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {currentRepo.watchers_count} watchers
                </div>
                {currentRepo.language && (
                  <div className="flex items-center">
                    <FileCode className="h-4 w-4 mr-1" />
                    {currentRepo.language}
                  </div>
                )}
              </div>
            </div>

            {/* Branch Selector */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Branch</h3>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    loadCommits(currentRepo.owner.login, currentRepo.name, e.target.value);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[

                    { id: 'commits', label: 'Commits', icon: GitCommit },
                    { id: 'files', label: 'Files', icon: FileCode },
                    { id: 'diff', label: 'Diff', icon: Diff },
                    { id: 'ai-summary', label: 'AI Summary', icon: Bot }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'commits' && (
                  <div className="space-y-4">
                    {commits.map((commit) => (
                      <div
                        key={commit.sha}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-sky-50 ${
                          selectedCommit?.sha === commit.sha
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => loadCommitDetails(commit)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{commit.commit.message}</h4>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <User className="h-4 w-4 mr-1" />
                              <span className="mr-4">{commit.commit.author.name}</span>
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(commit.commit.author.date)}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {commit.sha.substring(0, 7)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'files' && selectedCommit?.files && (
                  <div className="space-y-4">
                    {selectedCommit.files.map((file) => (
                      <div key={file.filename} className="border rounded-lg">
                        <div
                          className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleFileExpansion(file.filename)}
                        >
                          <div className="flex items-center">
                            <FileCode className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium">{file.filename}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              file.status === 'added' ? 'bg-green-100 text-green-800' :
                              file.status === 'removed' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {file.status}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="text-green-600 mr-2">+{file.additions}</span>
                            <span className="text-red-600 mr-2">-{file.deletions}</span>
                            {expandedFiles.has(file.filename) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        {expandedFiles.has(file.filename) && file.patch && (
                          <div className="border-t">
                            {renderDiff(file.patch)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'diff' && selectedCommit?.files && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Code Changes</h3>
                      <div className="text-sm text-gray-500">
                        {selectedCommit.files.length} files changed
                      </div>
                    </div>
                    {selectedCommit.files.map((file) => (
                      <div key={file.filename} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{file.filename}</span>
                            <div className="flex items-center text-sm">
                              <span className="text-green-600 mr-2">+{file.additions}</span>
                              <span className="text-red-600">-{file.deletions}</span>
                            </div>
                          </div>
                        </div>
                        {file.patch && (
                          <div className="max-h-96 overflow-y-auto">
                            {renderDiff(file.patch)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'ai-summary' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">AI-Powered Commit Analysis</h3>
                      <button
                        onClick={generateAISummary}
                        disabled={!selectedCommit || summaryLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                        {summaryLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Bot className="h-4 w-4 mr-2" />
                        )}
                        Generate Summary
                      </button>
                    </div>
                    
                    {!selectedCommit ? (
                      <div className="text-center py-8 text-gray-500">
                        Select a commit to generate AI summary
                      </div>
                    ) : summaryLoading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600">Analyzing commit with AI...</p>
                      </div>
                    ) : aiSummary ? (
                      <div className="prose max-w-none">
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                          {aiSummary}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Click "Generate Summary" to analyze the selected commit
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default GitHub;