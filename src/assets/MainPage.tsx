import { useState, useRef, useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Avatar from '@mui/joy/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClock,
  faCalendarDays,
  faGear,
  faChartSimple,
  faSignOut,
  faChevronRight,
  
} from '@fortawesome/free-solid-svg-icons';
import { UserContext } from "./contexts/UserContext";
import axios from "axios";
import { createApiUrl, apiConfig } from "../utils/apiConfig";
import { faGithub } from '@fortawesome/free-brands-svg-icons';
type TabType = 'Registar' | 'Calendário' | 'Settings' | 'Diagramas' | 'GitHub' | null;

export default function PersistentTabBar() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [expandedTabs, setExpandedTabs] = useState<TabType[]>([]);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const popupRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { username, setUsername } = useContext(UserContext);
  const [firstname, setFirstname] = useState("");
  const [group, setGroup] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('username');
    if (!email) {
      if (!username) {
        navigate('/', { replace: true });
      }
      return;
    }
    if (!username) {
      setUsername(email);
    }
  }, [setUsername, username, navigate]);

  useEffect(() => {
    async function fetchFirstnameAndGroup() {
      if (!username) return;
      try {
        const res = await axios.post(createApiUrl(apiConfig.endpoints.information), { username });
        setFirstname(res.data.firstname);
        setGroup(res.data.group || "");
      } catch {
        setFirstname("");
        setGroup("");
      }
    }
    fetchFirstnameAndGroup();
  }, [username]);

  useEffect(() => {
    if (username) {
      axios.get(createApiUrl(apiConfig.endpoints.userId), { params: { email: username } })
        .then(res => setUserId(res.data?.user_id || null))
        .catch(() => setUserId(null));
    }
  }, [username]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setActiveTab(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
    setExpandedTabs([]);
    setShowPopup(false);
    setActiveTab(null);
  };

  const toggleTab = (tab: TabType, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isCollapsed) {
      setExpandedTabs(prev =>
        prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]
      );
    } else {
      const button = buttonRefs.current[tab as string];
      if (button) {
        const rect = button.getBoundingClientRect();
        const isRight = rect.left > window.innerWidth / 2;

        setPopupPosition({
          top: rect.top,
          left: isRight ? rect.left - 200 : rect.right
        });
      }

      setShowPopup(activeTab !== tab);
      setActiveTab(activeTab !== tab ? tab : null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('rememberMe');
    setUsername("");
    navigate('/');
  };

  const handleSubOptionClick = (tab: TabType, label: string) => {
    let route = '/';
    if (tab === 'Registar') {
      if (label === 'Registar') route = '/main/registar/registo';
      else if (label === 'Display') route = '/main/registar/display';
    } else if (tab === 'Calendário') {
      if (label === 'Visualizar') route = '/main/calendario';
    } else if (tab === 'Settings') {
      if (label === 'Perfil') route = '/main/settings/perfil';
      else if (label === 'Configurações') route = '/main/settings/configuracoes';
    } else if (tab === 'Diagramas') {
      if (label === 'My Perform') route = '/main/diagramas/MyPerform';
      else if (label === 'Relatórios') route = '/main/diagramas/relatorios';
    } else if (tab === 'GitHub') {
      console.log('🔍 GitHub navigation triggered!', { tab, label });
      if (label === 'Github Projetos') {
        route = '/main/gitHub/githubprojetos';
        console.log('✅ GitHub route set:', route);
      }
    }

    console.log('🚀 Navigating to route:', route);
    navigate(route);
    setShowPopup(false);
    setActiveTab(null);
  };

  const navButtons = [
    { tab: 'Registar', icon: faClock, label: 'Registar', children: ['Registar', 'Display'] },
    { tab: 'Calendário', icon: faCalendarDays, label: 'Calendário', children: ['Visualizar'] },
    { tab: 'Settings', icon: faGear, label: 'Settings', children: ['Perfil', 'Configurações'] },
    { tab: 'Diagramas', icon: faChartSimple, label: 'Diagramas', children: ['My Perform', 'Relatórios'] },
    { tab: 'GitHub', icon: faGithub, label: 'GitHub', children: ['Github Projetos'] },
  ];

  useEffect(() => {
    if (username && !initialLoadDone) {
      navigate('/main/registar/registo');
      setInitialLoadDone(true);
    }
  }, [username, navigate, initialLoadDone]);

  return (
    <div className='flex h-screen overflow-auto'>
      {/* Fixed Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r ${isCollapsed ? 'w-20' : 'w-60'} transition-all duration-500 z-50`}>
        <div className='h-full flex flex-col'>
          {/* Logo */}
          {!isCollapsed && (
            <div className='p-4'>
              <img src='/logo1.png' alt='Logo' className='w-full h-auto object-contain' />
            </div>
          )}

          {/* Nav Items */}
          <div className='flex-1 flex flex-col items-center justify-center gap-4'>
            {navButtons.map(btn => (
              <div key={btn.tab} className='w-full text-left'>
                <button
                  ref={el => { buttonRefs.current[btn.tab] = el; }}
                  onClick={(e) => toggleTab(btn.tab as TabType, e)}
                  className={`flex items-center px-4 py-2 w-full gap-2 hover:bg-sky-50 ${activeTab === btn.tab ? 'bg-sky-50' : ''}`}
                >
                  <FontAwesomeIcon icon={btn.icon} />
                  {!isCollapsed && (
                    <>
                      <span>{btn.label}</span>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`
                          ml-auto transition-transform text-gray-400 text-xs
                          ${expandedTabs.includes(btn.tab as TabType) ? 'rotate-90' : ''}
                        `}
                      />
                    </>
                  )}
                </button>

                {/* Tree View Suboptions */}
                {!isCollapsed && expandedTabs.includes(btn.tab as TabType) && (
                  <div className='ml-8 mt-1 flex flex-col gap-1'>
                    {btn.children.map((child, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubOptionClick(btn.tab as TabType, child)}
                        className='text-sm text-gray-600 hover:text-sky-500 text-left'
                      >
                        {child}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Avatar & Logout */}
          <div className='p-4 flex flex-col items-center'>
            <Avatar alt='User' src='/avatar1.png' sx={{ width: '36px', height: '36px' }} />
            {!isCollapsed && (
              <>
                <p className='mt-2 text-sm font-semibold'>Olá, {firstname}</p>
                {group && <p className='text-xs text-gray-500'>Equipa: {group}</p>}
              </>
            )}
            <button onClick={handleLogout} className='mt-2 text-red-400 hover:text-red-600 text-sm'>
              <FontAwesomeIcon icon={faSignOut} className='mr-2' />
              {!isCollapsed && 'Logout'}
            </button>
          </div>
        </div>

        {/* Popup for collapsed sub-options */}
        {isCollapsed && showPopup && activeTab && (
          <div
            ref={popupRef}
            className='absolute bg-white rounded shadow p-2 z-50 w-48'
            style={{ top: popupPosition.top, left: popupPosition.left }}
          >
            {navButtons.find(b => b.tab === activeTab)?.children.map((label, index) => (
              <button
                key={index}
                onClick={() => handleSubOptionClick(activeTab, label)}
                className='block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm'
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collapse button - fixed position with smooth transition */}
      <div className={`fixed top-8 z-50 transition-all duration-500 ${isCollapsed ? 'left-20' : 'left-60'}`}>
        <button onClick={toggleNavbar} className='bg-white p-2 rounded-r-2xl border-r-2 shadow-md'>
          <FontAwesomeIcon icon={faArrowLeft} className={`${isCollapsed ? 'rotate-180' : ''} transition-transform duration-300 text-gray-500`} />
        </button>
      </div>

      {/* Main Content - with margin to account for fixed sidebar */}
      <div className='flex-1 min-h-screen p-4' style={{ marginLeft: isCollapsed ? '5rem' : '15rem' }}>
        <Outlet context={{ username, group, user_id: userId }} />
      </div>
    </div>
  );
}
