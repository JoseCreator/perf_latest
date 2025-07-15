/**
 * RegistarHoras Component - Time Tracking Registration System
 * 
 * This module contains the main time tracking registration form component for the Perf Duarte
 * time management system. It provides a comprehensive interface for users to log their working hours
 * with detailed project and activity categorization.
 * 
 * @module RegistarHoras
 * @author Perf Duarte Development Team
 * @since 2025-06-30
 */

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Autocomplete from '@mui/joy/Autocomplete';
import Checkbox from '@mui/joy/Checkbox';
import Textarea from '@mui/joy/Textarea';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';

/**
 * Type definition for Client entity
 * @interface Cliente
 */
type Cliente = { 
  /** Unique client identifier */
  id?: number; 
  /** Client name in Portuguese */
  nome?: string; 
  /** Display label for UI components */
  label?: string; 
  /** Alternative name field */
  name?: string 
};

/**
 * Type definition for Group/Project entity
 * @interface Group
 */
type Group = { 
  /** Unique group identifier */
  id?: number; 
  /** Group name in Portuguese */
  nome?: string; 
  /** Display label for UI components */
  label?: string; 
  /** Alternative name field */
  name?: string 
};

/**
 * Type definition for Task Category entity
 * @interface Category
 */
type Category = { 
  /** Unique category identifier */
  id?: number; 
  /** Category name in Portuguese */
  nome?: string; 
  /** Display label for UI components */
  label?: string; 
  /** Alternative name field */
  name?: string 
};

/**
 * Type definition for Task Type entity
 * @interface TaskType
 */
type TaskType = {
  /** Display label for the task type */
  label: string;
  /** Unique task type identifier */
  id: number;
};

/**
 * Static array defining task types
 * Currently only contains one type with ID 1
 * @constant {TaskType[]}
 */
const tipo: TaskType[] = [
  { label: '1', id: 1 },
];

/**
 * RegistoHoras Component - Main time tracking registration form
 * 
 * This component provides a comprehensive interface for users to register their working hours,
 * including project selection, activity categorization, time tracking, and detailed descriptions.
 * 
 * Features:
 * - Client and project selection with autocomplete
 * - Task categorization and typing
 * - Date/time range selection
 * - Billable hours and overtime tracking
 * - Activity description with rich text area
 * - Form validation and API integration
 * 
 * @returns {JSX.Element} The time registration form interface
 * 
 * @example
 * ```tsx
 * <RegistoHoras />
 * ```
 */
export default function RegistoHoras() {
  // Get username and group from Outlet context
  const { username, group } = useOutletContext<{ username: string; group: string }>();

  // ===== STATE MANAGEMENT =====
  
  /** Current user's unique identifier from database */
  const [userId, setUserId] = useState<number | null>(null);
  
  /** Current user's group identifier from database */
  const [groupId, setGroupId] = useState<number | null>(null);
  
  /** List of available clients for the current user */
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  /** Loading state for clients data fetch */
  const [clientesLoading, setClientesLoading] = useState(false);
  
  /** List of available projects/groups for the current user */
  const [grupos, setGrupos] = useState<Group[]>([]);
  
  /** Loading state for projects data fetch */
  const [gruposLoading, setGruposLoading] = useState(false);
  
  /** List of available task categories */
  const [categorias, setCategorias] = useState<Category[]>([]);
  
  /** Loading state for categories data fetch */
  const [categoriasLoading, setCategoriasLoading] = useState(false);
  
  /** Currently selected client from dropdown */
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  /** Currently selected project/group from dropdown */
  const [selectedGrupo, setSelectedGrupo] = useState<Group | null>(null);
  
  /** Currently selected task category from dropdown */
  const [selectedCategoria, setSelectedCategoria] = useState<Category | null>(null);
  
  /** Currently selected task type from dropdown */
  const [selectedTipo, setSelectedTipo] = useState<TaskType | null>(null);
  
  /** Task description text input by user */
  const [descricao, setDescricao] = useState('');
  
  /** Start date and time for the time entry */
  const [inicio, setInicio] = useState<Dayjs | null>(null);
  
  /** End date and time for the time entry */
  const [fim, setFim] = useState<Dayjs | null>(null);
  
  /** Whether this time entry should be marked as billable to client */
  const [billable, setBillable] = useState(false);
  
  /** Whether this time entry should be marked as overtime */
  const [overtime, setOvertime] = useState(false);
  
  /** Project ID fetched based on selected project name */
  const [projectId, setProjectId] = useState<number | null>(null);

  // ===== EFFECTS FOR INITIAL DATA LOADING =====
  
  /**
   * Effect to fetch user and group IDs when username/group context changes
   * This runs when the component mounts or when username/group props change
   */
  useEffect(() => {
    // Fetch user_id from utilizadores using username
    if (username) {
      axios.get(createApiUrl(apiConfig.endpoints.userId), { params: { email: username } })
        .then(res => setUserId(res.data?.user_id || null))
        .catch(() => setUserId(null));
    }
    // Fetch group_id from groups using group name
    if (group) {
      axios.get(createApiUrl(apiConfig.endpoints.groupId), { params: { name: group } })
        .then(res => setGroupId(res.data?.id || null))
        .catch(() => setGroupId(null));
    }
  }, [username, group]);

  /**
   * Effect to load dropdown data (clients, projects, categories) when userId is available
   * This ensures we only fetch user-specific data after the user is identified
   */
  useEffect(() => {
    // Load initial data only when userId is available
    if (!userId) return;
    
    // ===== FETCH CLIENTS =====
    setClientesLoading(true);
    axios.get(createApiUrl(apiConfig.endpoints.clientsByUser), { params: { user_id: userId } })
      .then((res) => {
        setClientes(res.data);
        setClientesLoading(false);
      })
      .catch(() => {
        setClientesLoading(false);
        setClientes([]);
      });

    // ===== FETCH PROJECTS =====
    setGruposLoading(true);
    axios.get(createApiUrl(apiConfig.endpoints.projectsByUser), { params: { user_id: userId } })
      .then((res) => {
        console.log('Projects response:', res.data);
        const projects = res.data?.projects || [];
        // Transform project names into dropdown format
        setGrupos(projects.map((projectName: string, idx: number) => ({ 
          label: projectName,
          id: idx
        })));
        setGruposLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching projects:', error);
        setGruposLoading(false);
        setGrupos([]);
      });

    // ===== FETCH CATEGORIES =====
    setCategoriasLoading(true);
    fetch(createApiUrl(apiConfig.endpoints.categories))
      .then((res) => res.json())
      .then((data: any[]) => {
        // Transform categories to ensure consistent label format
        setCategorias(data.map((cat: any) => ({ 
          label: cat.task_category || cat.nome || cat.label || cat.name || cat.id, 
          ...cat 
        })));
        setCategoriasLoading(false);
      })
      .catch(() => {
        setCategoriasLoading(false);
      });
  }, [userId]);

  /**
   * Effect to fetch project ID when a project/group is selected
   * This ensures we have the correct project ID for database operations
   */
  useEffect(() => {
    if (selectedGrupo?.label) {
      axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedGrupo.label } })
        .then(res => setProjectId(res.data?.project_id || null))
        .catch(() => setProjectId(null));
    } else {
      setProjectId(null);
    }
  }, [selectedGrupo]);

  /**
   * Handles the time registration form submission
   * 
   * This function performs the following operations:
   * 1. Validates required fields (userId, start time, end time)
   * 2. Validates time overlap with existing entries
   * 3. Fetches additional IDs for selected dropdown values
   * 4. Constructs and submits the timesheet payload
   * 5. Provides user feedback on success/failure
   * 
   * @async
   * @function handleRegistar
   * @returns {Promise<void>}
   * 
   * @throws {Error} When validation fails or API calls fail
   */
  const handleRegistar = async () => {
    // ===== INITIAL VALIDATION =====
    if (!userId || !inicio || !fim) {
      alert('Por favor, preencha os campos obrigatórios (data início e fim)');
      return;
    }

    // ===== TIME OVERLAP VALIDATION =====
    // Validate the time registration to prevent overlapping entries
    try {
      const validationRes = await axios.get(createApiUrl(apiConfig.endpoints.validateTimesheet), {
        params: {
          user_id: userId,
          start_date: inicio.toISOString(),
          end_date: fim.toISOString()
        }
      });

      if (!validationRes.data.valid) {
        alert(validationRes.data.error);
        return;
      }
    } catch (err) {
      alert('Erro ao validar o registro de horas');
      return;
    }

    // ===== ID RESOLUTION =====
    // Use fetched userId and groupId, then resolve additional IDs
    const user_id = userId;
    let group_id = groupId;
    let client_id = selectedCliente?.id || null;
    let category_id = selectedCategoria?.id || null;
    let project_id = projectId;

    // Resolve group ID from selected project name
    if (selectedGrupo?.label) {
      const res = await axios.get(createApiUrl(apiConfig.endpoints.groupId), { params: { name: selectedGrupo.label } });
      group_id = res.data?.id || group_id;
    }
    
    // Resolve client ID from selected client name
    if (selectedCliente?.label) {
      const res = await axios.get(createApiUrl(apiConfig.endpoints.clientId), { params: { name: selectedCliente.label } });
      client_id = res.data?.client_id || client_id;
    }
    
    // Resolve category ID from selected category name
    if (selectedCategoria?.label) {
      const res = await axios.get(createApiUrl(apiConfig.endpoints.categoryId), { params: { name: selectedCategoria.label } });
      category_id = res.data?.task_category_id || category_id;
    }

    // Ensure project_id is set (fallback resolution)
    if (!project_id && selectedGrupo?.label) {
      const res = await axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedGrupo.label } });
      project_id = res.data?.project_id || null;
    }

    // ===== PAYLOAD CONSTRUCTION =====
    const payload = {
      user_id,
      group_id,
      client_id,
      project_id,
      category_id,
      task_id: selectedTipo?.id || null,
      rate_user_id: null,
      start_date: inicio ? inicio.toISOString() : null,
      end_date: fim ? fim.toISOString() : null,
      hours: inicio && fim ? (fim.diff(inicio, 'hour', true)) : null, // Calculate hours difference
      description: descricao,
      billable: billable ? 1 : 0, // Convert boolean to integer
      overtime: overtime ? 1 : 0, // Convert boolean to integer
      total_hours: null,
      approved: 0, // Default to not approved
      activity_id: null,
      updated_at: null,
      created_at: null,
      group_name: selectedGrupo?.label || null,
      rate_value: null
    };

    // ===== API SUBMISSION =====
    try {
      await axios.post(createApiUrl(apiConfig.endpoints.timesheet), payload);
      alert('Registo inserido com sucesso!');
    } catch (err: any) {
      // Handle specific error messages from API
      if (err.response && err.response.data && err.response.data.error) {
        alert('Erro ao registar: ' + err.response.data.error);
      } else {
        alert('Erro ao registar!');
      }
    }
  };

  /**
   * Content map defining the UI structure for the time registration form
   * Uses a single 'registar' key to maintain consistency with existing structure
   * 
   * @constant {Object} contentMap
   * @property {Object} registar - Contains the main form content JSX
   */
  const contentMap = {
    registar: {
      content: (
        <div className="min-h-screen bg-gradient-to-br p-6">
          
          {/* ===== HEADER SECTION ===== */}
          <div className="max-w-7xl mx-auto mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Registo de Horas
              </h1>
              <p className="text-slate-600 text-lg">Organiza o teu tempo de forma eficiente</p>
            </motion.div>
          </div>

          {/* ===== MAIN CONTENT GRID ===== */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* ===== LEFT COLUMN: PROJECT & ACTIVITY SECTION ===== */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                
                {/* Project Selection Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    {/* Project Icon */}
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m4 0h1" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Projeto</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Client Selection Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Cliente</label>
                      <Autocomplete
                        placeholder="Selecione um cliente..."
                        options={clientes}
                        loading={clientesLoading}
                        value={selectedCliente}
                        onChange={(_, v) => setSelectedCliente(v)}
                        sx={{ 
                          '& .MuiAutocomplete-root': {
                            borderRadius: '12px',
                          }
                        }}
                      />
                    </div>
                    
                    {/* Project Selection Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Projeto</label>
                      <Autocomplete
                        placeholder="Selecione um projeto..."
                        options={grupos}
                        loading={gruposLoading}
                        value={selectedGrupo}
                        onChange={(_, v) => setSelectedGrupo(v)}
                        sx={{ 
                          '& .MuiAutocomplete-root': {
                            borderRadius: '12px',
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Classification Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    {/* Activity Icon */}
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Atividade</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Category Selection Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
                      <Autocomplete
                        placeholder="Selecione uma categoria..."
                        options={categorias}
                        loading={categoriasLoading}
                        value={selectedCategoria}
                        onChange={(_, v) => setSelectedCategoria(v)}
                        sx={{ 
                          '& .MuiAutocomplete-root': {
                            borderRadius: '12px',
                          }
                        }}
                      />
                    </div>
                    
                    {/* Task Type Selection Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                      <Autocomplete
                        placeholder="Selecione um tipo..."
                        options={tipo}
                        value={selectedTipo}
                        onChange={(_, v) => setSelectedTipo(v)}
                        sx={{ 
                          '& .MuiAutocomplete-root': {
                            borderRadius: '12px',
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ===== RIGHT COLUMN: TIME & DETAILS SECTION ===== */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                
                {/* Time Tracking Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    {/* Time Icon */}
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Horário</h2>
                  </div>
                  
                  {/* Date/Time Pickers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Start Date/Time Picker */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data/Hora Início</label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          label="Início"
                          value={inicio}
                          onChange={setInicio}
                          sx={{ width: '100%' }}
                        />
                      </LocalizationProvider>
                    </div>
                    
                    {/* End Date/Time Picker */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data/Hora Fim</label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          label="Fim"
                          value={fim}
                          onChange={setFim}
                          sx={{ width: '100%' }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>
                  
                  {/* Options Checkboxes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Billable Hours Checkbox */}
                    <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <Checkbox 
                        label="Faturável" 
                        variant="solid" 
                        checked={billable} 
                        onChange={e => setBillable(e.target.checked)} 
                        sx={{ '& .MuiCheckbox-checkbox': { borderRadius: '6px' } }}
                      />
                    </div>
                    
                    {/* Overtime Hours Checkbox */}
                    <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <Checkbox 
                        label="Horas Extras" 
                        variant="solid" 
                        checked={overtime} 
                        onChange={e => setOvertime(e.target.checked)}
                        sx={{ '& .MuiCheckbox-checkbox': { borderRadius: '6px' } }}
                      />
                    </div>
                    
                    {/* New Client Checkbox (Currently Static) */}
                    <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <Checkbox 
                        label="Novo Cliente" 
                        variant="solid"
                        sx={{ '& .MuiCheckbox-checkbox': { borderRadius: '6px' } }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description Input Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    {/* Description Icon */}
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Descrição</h2>
                  </div>
                  
                  {/* Multi-line Text Area for Activity Description */}
                  <Textarea
                    placeholder="Descreva as atividades realizadas..."
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    minRows={6}
                    sx={{ 
                      width: '100%',
                      borderRadius: '12px',
                      '& .MuiTextarea-textarea': {
                        fontSize: '16px',
                        lineHeight: '1.5',
                      }
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* ===== SUBMIT BUTTON SECTION ===== */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center mt-12"
            >
              {/* Main Submit Button with Hover Effects */}
              <button 
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700"
                onClick={handleRegistar}
              >
                <span className="flex items-center">
                  {/* Plus Icon with Rotation Animation */}
                  <svg className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registar Horas
                </span>
                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </motion.div>
          </div>
        </div>
      )
    },
  } as const;

  /**
   * Main component render with animation wrapper
   * Uses AnimatePresence for smooth transitions and motion.div for fade-in effect
   * 
   * @returns {JSX.Element} The animated time registration form
   */
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {contentMap.registar.content}
      </motion.div>
    </AnimatePresence>
  );
}