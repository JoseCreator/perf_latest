import { useState, useEffect, useRef } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { apiConfig, createApiUrl } from '../utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PerformClientes() {
  const [selectedProject, setSelectedProject] = useState("");
  const [activeView, setActiveView] = useState('Geral');
  const [projects, setProjects] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ user_id: number; First_Name: string; Last_Name: string }>>([]);
  const [totalProjectHours, setTotalProjectHours] = useState<number>(0);
  const [timelineData, setTimelineData] = useState<{
    startDate: string | null;
    endDate: string | null;
    completionPercentage: number;
  }>({ startDate: null, endDate: null, completionPercentage: 0 });
  const [totalCost, setTotalCost] = useState<number>(0);
  const [budgetData, setBudgetData] = useState<{
    budget: number;
    currentCost: number;
    completionPercentage: number;
  }>({ budget: 0, currentCost: 0, completionPercentage: 0 });
  const [monthlyRisks, setMonthlyRisks] = useState<number[]>(Array(12).fill(0));
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ user_id: number; First_Name: string; Last_Name: string; role: string; hours: number } | null>(null);
  const [githubUserCommits, setGithubUserCommits] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const commitsGeneratedRef = useRef<string | null>(null);
  const [detailedAISummaries, setDetailedAISummaries] = useState<{[key: string]: string}>({});
  const [loadingDetailedSummary, setLoadingDetailedSummary] = useState<{[key: string]: boolean}>({});
  const [showDetailedSummary, setShowDetailedSummary] = useState<{[key: string]: boolean}>({});
  const [currentRepoInfo, setCurrentRepoInfo] = useState<{owner: string; repo: string} | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(createApiUrl(apiConfig.endpoints.allProjects));
        const projectNames = response.data || [];
        setProjects(projectNames);
        setAllProjects(projectNames);
        if (projectNames.length > 0) {
          setSelectedProject(projectNames[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, []);

  function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}h ${minutes}m ${seconds}s`;
}

  // Generate detailed AI summary for a specific commit
  const generateDetailedAISummary = async (commit: any, repoOwner: string, repoName: string) => {
    const commitKey = `${commit.sha}`;
    
    // Check if already loaded
    if (detailedAISummaries[commitKey]) {
      return detailedAISummaries[commitKey];
    }

    setLoadingDetailedSummary(prev => ({ ...prev, [commitKey]: true }));

    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const response = await axios.post(
        createApiUrl(`${apiConfig.endpoints.githubAnalyze}/${repoOwner}/${repoName}/${commit.sha}`),
        {},
        { params: { token } }
      );

      if (response.data.analysis) {
        const detailedSummary = response.data.analysis.summary;
        setDetailedAISummaries(prev => ({ ...prev, [commitKey]: detailedSummary }));
        return detailedSummary;
      } else {
        throw new Error('No analysis data received');
      }
    } catch (error) {
      console.error('Failed to generate detailed AI summary:', error);
      // Fallback to generate a detailed mock summary
      const fallbackSummary = generateFallbackDetailedSummary(commit);
      setDetailedAISummaries(prev => ({ ...prev, [commitKey]: fallbackSummary }));
      return fallbackSummary;
    } finally {
      setLoadingDetailedSummary(prev => ({ ...prev, [commitKey]: false }));
    }
  };

  // Fallback detailed summary generator (similar to GitHub.tsx)
  const generateFallbackDetailedSummary = (commit: any) => {
    const message = commit.message.toLowerCase();
    
    let summary = `## 🔍 Commit Analysis\n\n`;
    
    if (message.includes('feat') || message.includes('add')) {
      summary += `**What was built:** This commit introduces new functionality to the ${selectedProject} application.\n\n`;
    } else if (message.includes('fix')) {
      summary += `**What was built:** This commit fixes bugs and resolves issues in the ${selectedProject} application.\n\n`;
    } else if (message.includes('docs')) {
      summary += `**What was built:** This commit updates documentation for the ${selectedProject} project.\n\n`;
    } else {
      summary += `**What was built:** This commit modifies existing functionality in the ${selectedProject} application.\n\n`;
    }
    
    summary += `**📊 Changes Summary:**\n`;
    summary += `- **Commit SHA:** ${commit.sha.substring(0, 12)}\n`;
    summary += `- **Message:** ${commit.message}\n`;
    summary += `- **Date:** ${formatDate(commit.date)}\n\n`;
    
    summary += `**🎯 Impact:** This change affects the ${selectedProject} codebase and should be tested thoroughly before deployment.\n\n`;
    summary += `**📝 Note:** This is a generated summary based on commit metadata. For more detailed analysis, ensure GitHub integration is properly configured.`;
    
    return summary;
  };


  useEffect(() => {
    const filterProjects = async () => {
      if (activeView === 'GitHub') {
        try {
          const response = await axios.get(createApiUrl(apiConfig.endpoints.projectsWithGithub));
          const githubProjects = response.data || [];
          setProjects(githubProjects);
          if (githubProjects.length > 0) {
            setSelectedProject(githubProjects[0]);
          } else {
            setSelectedProject("");
          }
        } catch (error) {
          console.error('Error fetching github projects:', error);
        }
      } else {
        setProjects(allProjects);
        if (allProjects.length > 0) {
          setSelectedProject(allProjects[0]);
        }
      }
    };
    filterProjects();
  }, [activeView, allProjects]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTeamMembers = async () => {
      try {
        console.log('Fetching team members for project:', selectedProject);  // Debug log
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectUsers + encodeURIComponent(selectedProject))
        );
        console.log('Team members response:', response.data);  // Debug log
        setTeamMembers(response.data);
      } catch (error) {
        setTeamMembers([]);
        console.error('Error fetching team members:', error);
      }
    };
    fetchTeamMembers();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTotalHours = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectTotalHours + '/' + encodeURIComponent(selectedProject))
        );
        setTotalProjectHours(response.data.totalHours || 0);
      } catch (error) {
        console.error('Error fetching total hours:', error);
        setTotalProjectHours(0);
      }
    };
    fetchTotalHours();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTimeline = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectTimeline + '/' + encodeURIComponent(selectedProject))
        );
        setTimelineData(response.data);
      } catch (error) {
        console.error('Error fetching timeline:', error);
        setTimelineData({ startDate: null, endDate: null, completionPercentage: 0 });
      }
    };
    fetchTimeline();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchProjectCost = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectCost + '/' + encodeURIComponent(selectedProject))
        );
        setTotalCost(response.data.totalCost || 0);
      } catch (error) {
        console.error('Error fetching project cost:', error);
        setTotalCost(0);
      }
    };
    fetchProjectCost();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchProjectBudget = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectBudget + '/' + encodeURIComponent(selectedProject))
        );
        setBudgetData(response.data);
      } catch (error) {
        console.error('Error fetching project budget:', error);
        setBudgetData({ budget: 0, currentCost: 0, completionPercentage: 0 });
      }
    };
    fetchProjectBudget();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchMonthlyRisks = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectRiskByMonth + '/' + encodeURIComponent(selectedProject))
        );
        setMonthlyRisks(response.data.monthlyRisks || Array(12).fill(0));
      } catch (error) {
        console.error('Error fetching monthly risks:', error);
        setMonthlyRisks(Array(12).fill(0));
      }
    };
    fetchMonthlyRisks();
  }, [selectedProject]);

  const handleMemberCardClick = (member: { user_id: number; First_Name: string; Last_Name: string; role: string; hours: number }) => {
    console.log('🎯 handleMemberCardClick fired:', { member, activeView });
    console.log('📊 Current GitHub commits data:', githubUserCommits);
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const projectMetrics = {
    budget: 50000,
    spent: 32000,
    timeline: 75,
    risk: 'low',
    cpi: 0.8
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "#3b82f6" }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
    );
  };

  const TeamMemberCard = ({ member, index, onClick }: { member: { user_id: number; First_Name: string; Last_Name: string }; index: number; onClick: (member: { user_id: number; First_Name: string; Last_Name: string; role: string; hours: number }) => void }) => {
    const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
    const bgColor = colors[index % colors.length];
    const [role, setRole] = useState('Loading...');
    const [hours, setHours] = useState<number>(0);

    useEffect(() => {
      const fetchRole = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userRoles + '/' + member.user_id)
          );
          setRole(response.data.role || 'N/A');
        } catch (error) {
          console.error('Error fetching role:', error);
          setRole('N/A');
        }
      };
      fetchRole();
    }, [member.user_id]);

    useEffect(() => {
      const fetchHours = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userHours + '/' + encodeURIComponent(selectedProject) + '/' + member.user_id)
          );
          setHours(response.data.totalHours || 0);
        } catch (error) {
          console.error('Error fetching hours:', error);
          setHours(0);
        }
      };
      if (selectedProject) {
        fetchHours();
      }
    }, [member.user_id, selectedProject]);

    return (
      <div onClick={() => onClick({ ...member, role, hours })} className="relative overflow-hidden rounded-2xl p-6 text-white cursor-pointer" style={{ backgroundColor: bgColor }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {member.First_Name[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{member.First_Name} {member.Last_Name}</h3>
              <h1 className='font-semibold'>Horas: {hours.toFixed(2)}</h1>
              <p className="text-sm opacity-80">{role}</p>
            </div>
          </div>
          {/* You can add more info here if needed */}
        </div>
      </div>
    );
  };


  const TeamMemberCardGitHub = ({ member, index, onClick }: { member: { user_id: number; First_Name: string; Last_Name: string }; index: number; onClick: (member: { user_id: number; First_Name: string; Last_Name: string; role: string; hours: number }) => void }) => {
    const colors = ['#002A4C', '#60798C', '#8093A1', '#405F77', '#204562'];
    const bgColor = colors[index % colors.length];
    const [role, setRole] = useState('Loading...');
    const [hours, setHours] = useState<number>(0);

    useEffect(() => {
      const fetchRole = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userRoles + '/' + member.user_id)
          );
          setRole(response.data.role || 'N/A');
        } catch (error) {
          console.error('Error fetching role:', error);
          setRole('N/A');
        }
      };
      fetchRole();
    }, [member.user_id]);

    useEffect(() => {
      const fetchHours = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userHours + '/' + encodeURIComponent(selectedProject) + '/' + member.user_id)
          );
          setHours(response.data.totalHours || 0);
        } catch (error) {
          console.error('Error fetching hours:', error);
          setHours(0);
        }
      };
      if (selectedProject) {
        fetchHours();
      }
    }, [member.user_id, selectedProject]);

    return (
      <div onClick={() => onClick({ ...member, role, hours })} className="relative overflow-hidden rounded-2xl p-6 text-white cursor-pointer" style={{ backgroundColor: bgColor }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {member.First_Name[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{member.First_Name} {member.Last_Name}</h3>
              <h1 className='font-semibold'>Horas: {hours.toFixed(2)}</h1>
              <p className="text-sm opacity-80">{role}</p>
            </div>
          </div>
          {/* You can add more info here if needed */}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (selectedProject) {
      axios.get(createApiUrl(apiConfig.endpoints.projectId), {
        params: { name: selectedProject }
      })
        .then((res) => {
          setSelectedProjectId(res.data.project_id);
        })
        .catch((error) => {
          console.error('Error fetching project ID:', error);
          setSelectedProjectId(null);
        });
    }
  }, [selectedProject]);

  useEffect(() => {
    if (activeView === 'GitHub' && selectedProjectId && teamMembers.length > 0) {
      console.log('🔍 Fetching live commits for project ID:', selectedProjectId);
      
      // Check if we've already generated commits for this project
      const projectKey = `${selectedProject}-${selectedProjectId}`;
      if (commitsGeneratedRef.current === projectKey) {
        console.log('⏭️ Skipping fetch - already done for this project');
        return;
      }
      
      // First, get GitHub repository info for this project
      axios.get(createApiUrl(apiConfig.endpoints.projectGithubInfo + '/' + selectedProjectId))
        .then((githubInfoRes) => {
          console.log('✅ GitHub info for project:', githubInfoRes.data);
          const { owner, repo } = githubInfoRes.data;
          
          // Store repository info for later use
          setCurrentRepoInfo({ owner, repo });
          
          // Now fetch live commits from GitHub
          return axios.get(createApiUrl(apiConfig.endpoints.githubLiveCommits), {
            params: { 
              owner,
              repo,
              project_id: selectedProjectId 
            }
          });
        })
        .then((res) => {
          console.log('✅ Received live commit data from GitHub:', {
            dataLength: Array.isArray(res.data) ? res.data.length : 'not an array',
            users: res.data?.map((u: any) => ({ 
              name: `${u.user?.First_Name} ${u.user?.Last_Name}`, 
              commitCount: u.commitCount 
            })) || []
          });
          
          if (!Array.isArray(res.data)) {
            console.warn('⚠️ Response data is not an array:', res.data);
            setGithubUserCommits([]);
            return;
          }
          
          if (res.data.length === 0) {
            console.log('📝 No live commits found, using mock data for demonstration');
            generateMockCommits();
          } else {
            // Use real GitHub data
            setGithubUserCommits(res.data);
          }
          
          commitsGeneratedRef.current = projectKey;
        })
        .catch((error) => {
          console.error('❌ Error fetching GitHub data:', error.message);
          
          if (error.response?.status === 404) {
            console.log('📝 Project has no GitHub repository - using mock data for demonstration');
          } else {
            console.log('📝 Using mock data due to error');
          }
          
          // Fallback to mock data when GitHub API fails or no repo configured
          generateMockCommits();
          commitsGeneratedRef.current = projectKey;
        });
    } else if (activeView !== 'GitHub') {
      // Clear commits when not in GitHub view
      setGithubUserCommits([]);
      setCurrentRepoInfo(null);
      setDetailedAISummaries({});
      setLoadingDetailedSummary({});
      commitsGeneratedRef.current = null;
    } else if (activeView === 'GitHub' && teamMembers.length === 0) {
      // Wait for team members to load
      console.log('⏳ Waiting for team members to load before fetching commits');
    }
    
    // Helper function to generate mock commits
    function generateMockCommits() {
      const baseTimestamp = Date.now();
      const mockCommits = teamMembers.slice(0, 3).map((member, index) => ({
        user: {
          user_id: member.user_id,
          First_Name: member.First_Name,
          Last_Name: member.Last_Name,
          github_account: `github_${member.First_Name.toLowerCase()}`
        },
        commits: [
          {
            sha: `demo_${member.user_id}_${index}_1_${baseTimestamp + index * 1000}`,
            message: `feat: Implement new features for ${selectedProject}`,
            date: new Date(baseTimestamp - index * 86400000).toISOString(),
            aiSummary: `Enhanced ${selectedProject} with new functionality (DEMO DATA)`,
            url: '#'
          },
          {
            sha: `demo_${member.user_id}_${index}_2_${baseTimestamp + index * 1000 + 1}`,
            message: `fix: Resolve issues in ${selectedProject} module`,
            date: new Date(baseTimestamp - (index + 1) * 86400000).toISOString(),
            aiSummary: `Bug fixes and improvements for ${selectedProject} (DEMO DATA)`,
            url: '#'
          },
          {
            sha: `demo_${member.user_id}_${index}_3_${baseTimestamp + index * 1000 + 2}`,
            message: `docs: Update documentation for ${selectedProject}`,
            date: new Date(baseTimestamp - (index + 2) * 86400000).toISOString(),
            aiSummary: `Documentation updates for ${selectedProject} (DEMO DATA)`,
            url: '#'
          }
        ],
        commitCount: 3
      }));
      
      // Ensure no duplicate users by user_id
      const uniqueMockCommits = mockCommits.filter((commit, index, array) => 
        array.findIndex(c => c.user.user_id === commit.user.user_id) === index
      );
      
      console.log('🧹 Generated mock commits:', {
        originalCount: mockCommits.length,
        uniqueCount: uniqueMockCommits.length,
        removedDuplicates: mockCommits.length - uniqueMockCommits.length,
        reason: 'No GitHub repository configured for this project'
      });
      
      setGithubUserCommits(uniqueMockCommits);
    }
  }, [activeView, selectedProjectId, teamMembers]);

  // Top-level render log
  console.log('🔄 PerformClientes render', {
    activeView,
    selectedProject,
    selectedMember,
    githubUserCommitsCount: githubUserCommits.length,
    githubUserCommitsData: githubUserCommits.map(u => ({
      userId: u.user?.user_id,
      name: `${u.user?.First_Name || 'N/A'} ${u.user?.Last_Name || 'N/A'}`,
      commitCount: u.commits?.length || 0
    })),
    teamMembersCount: teamMembers.length,
    showMemberModal,
    renderTimestamp: Date.now()
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Análise de Projeto</h1>
            <div className="hidden sm:block h-8 w-px bg-gray-400"></div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            >
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        <div className="flex gap-2 flex-wrap">
  {['Geral', 'Equipa', 'Métricas', 'GitHub'].map(view => {
    const isActive = activeView === view;
    const isGitHub = view === 'GitHub';

    return (
      <button
        key={view}
        onClick={() => setActiveView(view)}
        className={`
          px-5 py-2 rounded-full transition-all text-sm sm:text-base
          ${isActive
            ? (isGitHub ? 'bg-slate-800 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
            : (isGitHub ? 'bg-slate-600 text-white hover:bg-gray-500' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300')}
        `}
      >
        {view.charAt(0).toUpperCase() + view.slice(1)}
      </button>
    );
  })}
</div>
        </div>

        {/* Overview */}
        {activeView === 'Geral' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className='bg-blue-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Horas Registadas</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>{totalProjectHours.toFixed(2)}</div>
                    <div className='text-xl'>⏱️</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+ 30 H</div>
                    <div className='text-gray-500 text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-green-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Eficácia</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>88%</div>
                    <div className='text-xl'>⚡</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+2.1%</div>
                    <div className='text-gray-400 text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-yellow-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Custo</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>
                      €{(totalCost >= 1000 ? (totalCost/1000).toFixed(1) + 'K' : totalCost.toFixed(0))}
                    </div>
                    <div className='text-xl'>💰</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-red-500 text-sm'>+2k</div>
                    <div className='text-gray-400 text-sm'>do que semana passada</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-red-600">Risco do Projeto</h3>
                <LineChart
                  xAxis={[{ 
                    data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], 
                    scaleType: 'band' 
                  }]}
                  yAxis={[{ 
                    min: 0, 
                    max: 100, 
                    label: 'Risco do Projeto (%)',
                    labelStyle: { fill: '#666' }
                  }]}
                  series={[{ 
                    data: monthlyRisks, 
                    area: true, 
                    color: '#FF4063',
                    showMark: true,
                    label: 'Risco Mensal'
                  }]}
                  height={300}
                />
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Percentual do orçamento gasto por mês
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-lg font-semibold mb-4 text-purple-600">Progresso do Budget</h3>
                <CircularProgress percentage={budgetData.completionPercentage} color="#a855f7" />
                <div className="mt-4 text-sm text-gray-600">
                  €{budgetData.currentCost.toLocaleString(undefined, {maximumFractionDigits: 0})} / 
                  €{budgetData.budget.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Cronologia</h3>
                <CircularProgress percentage={timelineData.completionPercentage} color="#10b981" />
                <div className="mt-4 text-sm text-gray-600">
                  {timelineData.startDate ? 
                    `${new Date(timelineData.startDate).toLocaleDateString()} - ${new Date(timelineData.endDate || '').toLocaleDateString()}` 
                    : 'Datas não disponíveis'}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-yellow-600">CPI</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500">{projectMetrics.cpi}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {projectMetrics.cpi > 1 ? 'Acima de Budget' : 'Dentro de Budget'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team View */}
        {activeView === 'Equipa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <TeamMemberCard key={member.user_id} member={member} index={index} onClick={handleMemberCardClick} />
            ))}
          </div>
        )}

        {/* Metrics View */}
        {activeView === 'Métricas' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-blue-600">Análise de Risco</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-gray-700">Risco de Budget</span>
                  <span className="text-green-600 font-bold">Baixo</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-gray-700">Risco de Tempo</span>
                  <span className="text-yellow-600 font-bold">Medio</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-gray-700">Risco de Recurso</span>
                  <span className="text-red-600 font-bold">Alto</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-purple-600">Vista Financeira</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Revenue</span>
                    <span className="text-green-600 font-semibold">€45,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Costs</span>
                    <span className="text-red-600 font-semibold">€32,000</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div className="bg-red-500 rounded-full h-3" style={{ width: '64%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Profit Margin</span>
                    <span className="text-blue-600 font-semibold">28.9%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 rounded-full h-3" style={{ width: '29%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'GitHub' && (
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className='bg-slate-500 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-white font-bold'>
                  <div>Horas Registadas</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-white text-2xl'>{totalProjectHours.toFixed(2)}</div>
                    <div className='text-xl'>⏱️</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+ 30 H</div>
                    <div className='text-white text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-slate-600 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-white font-bold'>
                  <div>Eficácia</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-white text-2xl'>88%</div>
                    <div className='text-xl'>⚡</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+2.1%</div>
                    <div className='text-white text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-slate-700 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-white font-bold'>
                  <div>Custo</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-white text-2xl'>
                      €{(totalCost >= 1000 ? (totalCost/1000).toFixed(1) + 'K' : totalCost.toFixed(0))}
                    </div>
                    <div className='text-xl'>💰</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-red-500 text-sm'>+2k</div>
                    <div className='text-white text-sm'>do que semana passada</div>
                  </div>
                </div>
                
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {teamMembers.map((member, index) => (
              <TeamMemberCardGitHub key={member.user_id} member={member} index={index} onClick={handleMemberCardClick} />
            ))}
          </div>
            </div>

            

            <div className="xl:col-span-4 space-y-6">
              <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-xl font-semibold mb-4 text-purple-400">Progresso do Budget</h3>
                <CircularProgress percentage={budgetData.completionPercentage} color="#BC73FF" />
                <div className="mt-4 text-md text-purple-400 font-bold ">
                  €{budgetData.currentCost.toLocaleString(undefined, {maximumFractionDigits: 0})} / 
                  €{budgetData.budget.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
              <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-xl font-semibold mb-4 text-[#00FFAA]">Cronologia</h3>
                <CircularProgress percentage={timelineData.completionPercentage} color="#00FFAA" />
                <div className="mt-4 text-sm text-[#00FFAA]">
                  {timelineData.startDate ? 
                    `${new Date(timelineData.startDate).toLocaleDateString()} - ${new Date(timelineData.endDate || '').toLocaleDateString()}` 
                    : 'Datas não disponíveis'}
                </div>
              </div>
              
            </div>

             
          </div>
          
        )}
      </div>

      {/* Member Modal */}
      <AnimatePresence>
        {showMemberModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            {(() => { console.log('🟢 Modal render:', { selectedMember, activeView }); return null; })()}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-[500px] lg:w-full md:w-[800px] sm:w-[600px] max-w-4xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${activeView === 'GitHub' ? 'from-slate-700 via-slate-600 to-slate-500' : 'from-lime-400 via-emerald-400 to-sky-300'} p-6 text-white`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {selectedMember.First_Name} {selectedMember.Last_Name}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMemberModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div>
                    
                  <h3 className="font-bold text-lg">{selectedMember.First_Name} {selectedMember.Last_Name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.role}</p>
                </div>
                <div>
                  <p className="text-lg">Total de Horas no Projeto: <span className="font-bold">{selectedMember.hours.toFixed(2)} H</span></p>
                </div>
                {activeView === 'GitHub' && (
                  <div className="pt-4 border-t mt-4">
                    {(() => {
                      const filteredCommits = githubUserCommits.filter(user => user.user?.user_id === selectedMember.user_id);
                      console.log('🔍 Modal GitHub section debug:', {
                        hasCommits: githubUserCommits.length > 0,
                        selectedMemberId: selectedMember.user_id,
                        rawCommitsData: githubUserCommits,
                        totalUsersInCommits: githubUserCommits.length,
                        usersMatchingSelected: filteredCommits.length,
                        allUserIds: githubUserCommits.map(u => u.user?.user_id),
                        selectedUserCommitsDetails: filteredCommits.map(user => ({
                          userId: user.user?.user_id,
                          name: `${user.user?.First_Name} ${user.user?.Last_Name}`,
                          commitCount: user.commits?.length || 0,
                          commitShas: user.commits?.map((c: any) => c.sha) || []
                        })),
                        duplicateUserCheck: {
                          allUserIds: githubUserCommits.map(u => u.user?.user_id),
                          uniqueUserIds: [...new Set(githubUserCommits.map(u => u.user?.user_id))],
                          hasDuplicates: githubUserCommits.map(u => u.user?.user_id).length !== [...new Set(githubUserCommits.map(u => u.user?.user_id))].length
                        }
                      });
                      return null;
                    })()}
                    {githubUserCommits.length > 0 ? (
                      <div style={{ height: '300px', overflow: 'scroll' }}>
                        <h4 className="font-bold text-blue-700 mb-2">GitHub Commits</h4>
                        {(() => {
                          const filteredUsers = githubUserCommits.filter(user => user.user?.user_id === selectedMember.user_id);
                          // Ensure we only show unique users (in case there are duplicates)
                          const uniqueUsers = filteredUsers.filter((user, index, array) => 
                            array.findIndex(u => u.user?.user_id === user.user?.user_id) === index
                          );
                          
                          console.log('🔧 Final rendering check:', {
                            totalUsers: githubUserCommits.length,
                            filteredUsers: filteredUsers.length,
                            uniqueUsers: uniqueUsers.length,
                            selectedUserId: selectedMember.user_id
                          });
                          
                          return uniqueUsers.map((user: any, userIndex: number) => {
                            console.log(`🎭 Rendering user block ${userIndex}:`, {
                              userId: user.user.user_id,
                              name: `${user.user.First_Name} ${user.user.Last_Name}`,
                              commitCount: user.commits?.length || 0,
                              commits: user.commits?.map((c: any) => ({ sha: c.sha, message: c.message })) || []
                            });
                            return (
                              <div key={`user-${user.user.user_id}-${userIndex}`} className="mb-4">
                                <div className='flex flex-row justify-around border-t-2 border-s-2 border-r-2 border-gray-800 rounded-t-2xl '>
                                  <div className="font-bold text-gray-800 text-lg">{user.user.First_Name} {user.user.Last_Name} ({user.user.github_account})</div>
                                <div className="text-lg text-gray-800 mb-1 font-bold">Commits: {user.commitCount}</div>
                                </div>
                                
                                <div className='border-2 bg-gray-800'>
                                <ul className="list-disc ml-6">
                                  {user.commits.map((commit: any, commitIndex: number) => {
                                    console.log(`  🔹 Rendering commit ${commitIndex}:`, { sha: commit.sha, message: commit.message });
                                    const commitKey = `${commit.sha}`;
                                    const hasDetailedSummary = detailedAISummaries[commitKey];
                                    const isLoadingDetailed = loadingDetailedSummary[commitKey];
                                    
                                    return (
                                      <li key={`${user.user.user_id}-${commit.sha}-${commitIndex}`} className="mb-3 text-white">
                                        <div className="mb-1">
                                          <span className="font-mono text-md text-gray-200">{formatDate(commit.date)}:</span> 
                                          <span className="font-semibold ml-2">{commit.message}</span>
                                        </div>
                                        
                                        
                                        
                                        {/* Detailed AI Analysis Button */}
                                        {currentRepoInfo && (
                                          <button
                                            onClick={async () => {
                                              const commitKey = `${commit.sha}`;
                                              
                                              // If detailed summary is already shown, toggle it off
                                              if (showDetailedSummary[commitKey]) {
                                                setShowDetailedSummary(prev => ({ ...prev, [commitKey]: false }));
                                                return;
                                              }
                                              
                                              // If not loaded yet and not loading, fetch it
                                              if (!hasDetailedSummary && !isLoadingDetailed) {
                                                await generateDetailedAISummary(commit, currentRepoInfo.owner, currentRepoInfo.repo);
                                              }
                                              
                                              // Show the detailed summary
                                              setShowDetailedSummary(prev => ({ ...prev, [commitKey]: true }));
                                            }}
                                            disabled={isLoadingDetailed}
                                            className={`text-xs px-2 py-1 rounded transition-colors ${
                                              showDetailedSummary[commitKey]
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : hasDetailedSummary 
                                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                  : isLoadingDetailed
                                                    ? 'bg-gray-500 text-white cursor-not-allowed'
                                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                          >
                                            {isLoadingDetailed ? (
                                              'Analisar...'
                                            ) : showDetailedSummary[commitKey] ? (
                                              'X'
                                            ) : hasDetailedSummary ? (
                                              'Ver Detalhes'
                                            ) : (
                                              'Obter Detalhes'
                                            )}
                                          </button>
                                        )}
                                        
                                        {/* Detailed AI Summary Display */}
                                        {hasDetailedSummary && showDetailedSummary[commitKey] && (
                                          <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-600">
                                            <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                              {hasDetailedSummary}
                                            </div>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <p className="text-blue-700 font-semibold">GitHub-specific details can go here.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
