import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiConfig, createApiUrl } from '../utils/apiConfig';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select';
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

interface Client {
  id: number;
  name: string;
  group_id?: number;
  contact?: string;
  email?: string;
  active: boolean;
}

interface Project {
  id: number;
  name: string;
  project_type?: string;
  project_description?: string;
  client_id?: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  total_hours?: number;
  total_cost?: number;
  status?: string;
  group_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: number;
  name: string;
  last_name?: string;
  email: string;
  role: number;
  active: boolean;
  password?: string;
}

type EntityType = Client | Project | User;
type Entity = 'clientes' | 'projetos' | 'utilizadores';

export default function CRUDAdmin() {
  const [activeTab, setActiveTab] = useState<Entity>('clientes');
  const [clientes, setClientes] = useState<Client[]>([]);
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [utilizadores, setUtilizadores] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<EntityType>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [encodingFixLoading, setEncodingFixLoading] = useState(false);
  const [encodingFixResult, setEncodingFixResult] = useState<string | null>(null);
  const [corruptionCheckLoading, setCorruptionCheckLoading] = useState(false);
  const [corruptionReport, setCorruptionReport] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [detailedFixLoading, setDetailedFixLoading] = useState(false);
  const [detailedFixResult, setDetailedFixResult] = useState<any>(null);

  // Define form fields for each entity type
  const getFormFields = (): FormField[] => {
    switch (activeTab) {
      case 'clientes':
        return [
          { key: 'name', label: 'Nome', type: 'text', required: true },
          { key: 'group_id', label: 'ID do Grupo', type: 'number' },
          { key: 'contact', label: 'Contato', type: 'text' },
          { key: 'email', label: 'Email', type: 'email' }
        ];
      
      case 'projetos':
        return [
          { key: 'name', label: 'Nome', type: 'text', required: true },
          { key: 'project_type', label: 'Tipo', type: 'text' },
          { key: 'project_description', label: 'Descrição', type: 'text' },
          { key: 'client_id', label: 'ID do Cliente', type: 'number' },
          { key: 'start_date', label: 'Data de Início', type: 'text' },
          { key: 'end_date', label: 'Data de Término', type: 'text' },
          { key: 'hourly_rate', label: 'Taxa Horária', type: 'number' },
          { key: 'group_id', label: 'ID do Grupo', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'Active', label: 'Ativo' },
            { value: 'Inactive', label: 'Inativo' },
            { value: 'Completed', label: 'Concluído' }
          ]}
        ];
      
      case 'utilizadores':
        return [
          { key: 'name', label: 'Nome', type: 'text', required: true },
          { key: 'last_name', label: 'Sobrenome', type: 'text' },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'role', label: 'Função', type: 'select', required: true, options: [
            { value: 0, label: 'Usuário' },
            { value: 1, label: 'Admin' }
          ]},
          ...(editingId ? [] : [{ key: 'password', label: 'Senha', type: 'password' as const, required: true }])
        ];
      
      default:
        return [];
    }
  };

  // Get the current entity's data array based on active tab
  const getEntityData = (): EntityType[] => {
    switch (activeTab) {
      case 'clientes': return clientes;
      case 'projetos': return projetos;
      case 'utilizadores': return utilizadores;
      default: return [];
    }
  };

  // Filter entity data based on search term
  const getFilteredEntityData = (): EntityType[] => {
    const data = getEntityData();
    
    if (!searchTerm.trim()) {
      return data;
    }

    return data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by name for all entities
      if (item.name?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Additional search fields based on entity type
      switch (activeTab) {
        case 'clientes':
          const client = item as Client;
          return client.email?.toLowerCase().includes(searchLower) ||
                 client.contact?.toLowerCase().includes(searchLower);
                 
        case 'projetos':
          const project = item as Project;
          return project.project_type?.toLowerCase().includes(searchLower) ||
                 project.project_description?.toLowerCase().includes(searchLower) ||
                 project.status?.toLowerCase().includes(searchLower);
                 
        case 'utilizadores':
          const user = item as User;
          return user.email?.toLowerCase().includes(searchLower) ||
                 user.last_name?.toLowerCase().includes(searchLower);
                 
        default:
          return false;
      }
    });
  };

  // Fetch data function - wrapped with useCallback to prevent infinite loops
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let endpoint = '';
      
      switch (activeTab) {
        case 'clientes':
          endpoint = apiConfig.endpoints.adminClients;
          const clientsResponse = await axios.get<Client[]>(createApiUrl(endpoint));
          console.log('Fetched clients:', clientsResponse.data);
          setClientes(clientsResponse.data);
          break;
        
        case 'projetos':
          endpoint = apiConfig.endpoints.adminProjects;
          const projectsResponse = await axios.get<Project[]>(createApiUrl(endpoint));
          console.log('Fetched projects:', projectsResponse.data);
          setProjetos(projectsResponse.data);
          break;
        
        case 'utilizadores':
          endpoint = apiConfig.endpoints.adminUsers;
          const usersResponse = await axios.get<User[]>(createApiUrl(endpoint));
          console.log('Fetched users:', usersResponse.data);
          setUtilizadores(usersResponse.data);
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Erro ao carregar ${activeTab}`);
      switch (activeTab) {
        case 'clientes': setClientes([]); break;
        case 'projetos': setProjetos([]); break;
        case 'utilizadores': setUtilizadores([]); break;
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // Only depend on activeTab

  // Fetch data based on active tab
  useEffect(() => {
    // Clear search when switching tabs
    setSearchTerm('');
    fetchData();
  }, [activeTab, fetchData]); // Add fetchData to dependencies

  const handleAdd = async () => {
    try {
      setSubmitLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (activeTab) {
        case 'clientes':
          endpoint = apiConfig.endpoints.adminClients;
          const clientResponse = await axios.post<Client>(createApiUrl(endpoint), formData);
          setClientes(prev => [...prev, clientResponse.data]);
          break;
        
        case 'projetos':
          endpoint = apiConfig.endpoints.adminProjects;
          const projectResponse = await axios.post<Project>(createApiUrl(endpoint), formData);
          setProjetos(prev => [...prev, projectResponse.data]);
          break;
        
        case 'utilizadores':
          endpoint = apiConfig.endpoints.adminUsers;
          const userResponse = await axios.post<User>(createApiUrl(endpoint), formData);
          setUtilizadores(prev => [...prev, userResponse.data]);
          break;
      }
      
      setFormData({});
      alert(`${activeTab.slice(0, -1)} adicionado com sucesso!`);
    } catch (err: any) {
      console.error(`Error creating ${activeTab.slice(0, -1)}:`, err);
      setError(err.response?.data?.error || `Erro ao criar ${activeTab.slice(0, -1)}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (item: EntityType) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setSubmitLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (activeTab) {
        case 'clientes':
          endpoint = apiConfig.endpoints.adminClients;
          const clientResponse = await axios.put<Client>(
            createApiUrl(`${endpoint}/${editingId}`),
            formData
          );
          setClientes(prev => prev.map(item => 
            item.id === editingId ? clientResponse.data : item
          ));
          break;

        case 'projetos':
          endpoint = apiConfig.endpoints.adminProjects;
          const projectResponse = await axios.put<Project>(
            createApiUrl(`${endpoint}/${editingId}`),
            formData
          );
          setProjetos(prev => prev.map(item => 
            item.id === editingId ? projectResponse.data : item
          ));
          break;

        case 'utilizadores':
          endpoint = apiConfig.endpoints.adminUsers;
          const userResponse = await axios.put<User>(
            createApiUrl(`${endpoint}/${editingId}`),
            formData
          );
          setUtilizadores(prev => prev.map(item => 
            item.id === editingId ? userResponse.data : item
          ));
          break;
      }
      
      setFormData({});
      setEditingId(null);
      alert(`${activeTab.slice(0, -1)} atualizado com sucesso!`);
    } catch (err: any) {
      console.error(`Error updating ${activeTab.slice(0, -1)}:`, err);
      setError(err.response?.data?.error || `Erro ao atualizar ${activeTab.slice(0, -1)}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Tem certeza que deseja excluir este ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (activeTab) {
        case 'clientes':
          endpoint = apiConfig.endpoints.adminClients;
          await axios.delete(createApiUrl(`${endpoint}/${id}`));
          setClientes(prev => prev.filter(item => item.id !== id));
          break;

        case 'projetos':
          endpoint = apiConfig.endpoints.adminProjects;
          await axios.delete(createApiUrl(`${endpoint}/${id}`));
          setProjetos(prev => prev.filter(item => item.id !== id));
          break;

        case 'utilizadores':
          endpoint = apiConfig.endpoints.adminUsers;
          await axios.delete(createApiUrl(`${endpoint}/${id}`));
          setUtilizadores(prev => prev.filter(item => item.id !== id));
          break;
      }

      alert(`${activeTab.slice(0, -1)} excluído com sucesso!`);
    } catch (err: any) {
      console.error(`Error deleting ${activeTab.slice(0, -1)}:`, err);
      setError(err.response?.data?.error || `Erro ao excluir ${activeTab.slice(0, -1)}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
    setError(null);
  };

  const handleFixEncoding = async () => {
    setEncodingFixLoading(true);
    setEncodingFixResult(null);
    
    try {
      const response = await axios.post(createApiUrl(apiConfig.endpoints.fixEncoding));
      if (response.data.success) {
        setEncodingFixResult(`✅ Sucesso! ${response.data.recordsFixed} registros corrigidos.`);
        // Refresh data to show fixed characters
        fetchData();
      } else {
        setEncodingFixResult(`❌ Erro: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Encoding fix error:', error);
      setEncodingFixResult('❌ Erro ao corrigir codificação dos caracteres.');
    } finally {
      setEncodingFixLoading(false);
    }
  };

  const handleCheckCorruption = async () => {
    setCorruptionCheckLoading(true);
    setCorruptionReport(null);
    
    try {
      const response = await axios.get(createApiUrl(apiConfig.endpoints.checkCorruption));
      if (response.data.success) {
        setCorruptionReport(response.data.report);
      } else {
        setCorruptionReport({ error: response.data.message });
      }
    } catch (error) {
      console.error('Corruption check error:', error);
      setCorruptionReport({ error: 'Erro ao verificar corrupção de dados.' });
    } finally {
      setCorruptionCheckLoading(false);
    }
  };

  const handleDiagnoseCorruption = async () => {
    setDiagnosticLoading(true);
    setDiagnosticResult(null);
    
    try {
      const response = await axios.get(createApiUrl(apiConfig.endpoints.diagnoseCorruption));
      if (response.data.success) {
        setDiagnosticResult(response.data);
      } else {
        setDiagnosticResult({ error: response.data.message });
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      setDiagnosticResult({ error: 'Erro ao diagnosticar corrupção de dados.' });
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleDetailedFix = async () => {
    setDetailedFixLoading(true);
    setDetailedFixResult(null);
    
    try {
      const response = await axios.post(createApiUrl(apiConfig.endpoints.fixEncodingDetailed));
      if (response.data.success) {
        setDetailedFixResult(response.data);
        // Refresh data to show fixed characters
        fetchData();
      } else {
        setDetailedFixResult({ error: response.data.message });
      }
    } catch (error) {
      console.error('Detailed fix error:', error);
      setDetailedFixResult({ error: 'Erro ao corrigir codificação com detalhes.' });
    } finally {
      setDetailedFixLoading(false);
    }
  };

  const entityData = getFilteredEntityData();

  return (
    <div className="container mx-auto p-4">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4">
        {['clientes', 'projetos', 'utilizadores'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Entity)}
            className={`px-4 py-2 rounded focus:outline-none transition-colors ${
              activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Encoding Fix Section - Admin Tool */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Ferramenta de Administração</h3>
            <p className="text-sm text-yellow-700">Verificar e corrigir caracteres portugueses (ç, ã, õ, etc.) na base de dados</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCheckCorruption}
              disabled={corruptionCheckLoading}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                corruptionCheckLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {corruptionCheckLoading ? 'A Verificar...' : 'Verificar Dados'}
            </button>
            <button
              onClick={handleFixEncoding}
              disabled={encodingFixLoading}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                encodingFixLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {encodingFixLoading ? 'A Corrigir...' : 'Corrigir Codificação'}
            </button>
            <button
              onClick={handleDiagnoseCorruption}
              disabled={diagnosticLoading}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                diagnosticLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {diagnosticLoading ? 'A Diagnosticar...' : 'Diagnóstico Avançado'}
            </button>
            <button
              onClick={handleDetailedFix}
              disabled={detailedFixLoading}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                detailedFixLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {detailedFixLoading ? 'A Corrigir...' : 'Correção Avançada'}
            </button>
          </div>
        </div>
        
        {/* Corruption Report */}
        {corruptionReport && (
          <div className="mt-3 p-3 bg-white rounded border">
            <h4 className="font-semibold mb-2">Relatório de Verificação:</h4>
            {corruptionReport.error ? (
              <p className="text-red-600">❌ {corruptionReport.error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Total de registros corrompidos:</strong> {corruptionReport.totalCorrupted}
                </p>
                {corruptionReport.samplesFound?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Exemplos encontrados:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {corruptionReport.samplesFound.slice(0, 5).map((sample: any, index: number) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                          <span className="text-red-600">"{sample.original}"</span> → 
                          <span className="text-green-600"> "{sample.fixed}"</span>
                          <span className="text-gray-500"> ({sample.table}.{sample.column})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Fix Result */}
        {encodingFixResult && (
          <div className="mt-3 p-2 bg-white rounded border">
            <p className="text-sm">{encodingFixResult}</p>
          </div>
        )}

        {/* Diagnostic Result */}
        {diagnosticResult && (
          <div className="mt-3 p-3 bg-white rounded border">
            <h4 className="font-semibold mb-2">Diagnóstico Avançado:</h4>
            {diagnosticResult.error ? (
              <p className="text-red-600">❌ {diagnosticResult.error}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>Tabelas com corrupção:</strong> {diagnosticResult.totalTables}
                </p>
                {Object.keys(diagnosticResult.corruptedSamples || {}).length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {Object.entries(diagnosticResult.corruptedSamples).map(([table, samples]: [string, any]) => (
                      <div key={table} className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Tabela: {table}</h5>
                        {samples.slice(0, 3).map((sample: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                            <div><strong>Campo:</strong> {sample.field}</div>
                            <div><strong>Valor:</strong> <span className="text-red-600">"{sample.value}"</span></div>
                            <div><strong>Códigos:</strong> {sample.charCodes.map((c: any) => `${c.char}(${c.code})`).join(' ')}</div>
                            <div className="text-xs text-gray-500">
                              Não-ASCII: {sample.hasNonAscii ? 'Sim' : 'Não'} | 
                              ??: {sample.hasQuestionMarks ? 'Sim' : 'Não'} | 
                              Especiais: {sample.hasStrangeChars ? 'Sim' : 'Não'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detailed Fix Result */}
        {detailedFixResult && (
          <div className="mt-3 p-3 bg-white rounded border">
            <h4 className="font-semibold mb-2">Resultado da Correção Avançada:</h4>
            {detailedFixResult.error ? (
              <p className="text-red-600">❌ {detailedFixResult.error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Registros corrigidos:</strong> {detailedFixResult.totalRecordsFixed}
                </p>
                <p className="text-sm">
                  <strong>Alterações totais:</strong> {detailedFixResult.totalChanges}
                </p>
                {detailedFixResult.changes?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Exemplos de alterações:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {detailedFixResult.changes.slice(0, 10).map((change: any, index: number) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                          <div><strong>{change.table}</strong> (ID: {change.id}) - Campo: {change.field}</div>
                          <div>
                            <span className="text-red-600">Antes: "{change.before}"</span>
                          </div>
                          <div>
                            <span className="text-green-600">Depois: "{change.after}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-white shadow rounded p-4 mb-4">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? `Editar ${activeTab.slice(0, -1)}` : `Adicionar ${activeTab.slice(0, -1)}`}
        </h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          editingId ? handleUpdate() : handleAdd();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFormFields().map((field) => (
              <div key={field.key}>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData[field.key as keyof typeof formData]?.toString() || ''}
                    onChange={(e) => {
                      const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                      setFormData({ ...formData, [field.key]: value });
                    }}
                    required={field.required}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData[field.key as keyof typeof formData]?.toString() || ''}
                    onChange={(e) => {
                      const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                      setFormData({ ...formData, [field.key]: value });
                    }}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
            >
              {submitLoading ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow rounded p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Lista de {activeTab}</h2>
          <div className="flex items-center space-x-2">
            <label htmlFor="search" className="text-sm font-medium text-gray-700">
              Pesquisar:
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder={`Buscar ${activeTab === 'clientes' ? 'cliente' : activeTab === 'projetos' ? 'projeto' : 'usuário'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center "
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {searchTerm && (
          <div className="mb-4 text-sm text-gray-600">
            Encontrados {entityData.length} resultado(s) para "{searchTerm}"
          </div>
        )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Carregando...
          </div>
        </div>
      ) : (
        <>
          {entityData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `Nenhum resultado encontrado para "${searchTerm}"` : 'Nenhum registro encontrado.'}
            </div>
          ) : (
            <table className="w-[100px] lg:w-[1500px] md:w-[500px] sm:w-[300px] ">
              <thead>
                <tr className="bg-gray-50 ">
                  {getFormFields()
                    .filter(field => field.key !== 'password')
                    .map((field) => (
                      <th key={field.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {entityData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {getFormFields()
                      .filter(field => field.key !== 'password')
                      .map((field) => {
                        let value = item[field.key as keyof typeof item];
                        // Special formatting for role field
                        if (field.key === 'role') {
                          const roleOption = field.options?.find(opt => opt.value === value);
                          value = roleOption?.label || value;
                        }
                        return (
                          <td key={field.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {value?.toString() || ''}
                          </td>
                        );
                      })}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded mr-2 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="border-2 border-red-500 text-gray-800  hover:bg-red-500 hover:text-white  font-bold py-1 px-3 rounded transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              
            </table>
          )}
        </>
      )}
      </div>
    </div>
  );
}
