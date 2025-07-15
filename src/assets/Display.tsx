import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';
import { Clock, Calendar, User, UserX, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format decimal hours to 'H:MM (Xm)'
function formatHoursToHM(decimalHours: number | string | null | undefined): string {
  const num = typeof decimalHours === 'string' ? parseFloat(decimalHours) : decimalHours;
  if (typeof num !== 'number' || isNaN(num)) return '';
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

// Interface for DataCard props
interface DataCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

// Componente para cartão de dados
const DataCard = ({ icon: Icon, title, value, subtitle, color = "blue" }: DataCardProps) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-2xl border border-${color}-200 shadow-sm hover:shadow-md transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-${color}-600 text-sm font-medium mb-1`}>{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
      </div>
      <Icon className={`text-${color}-500 w-8 h-8`} />
    </div>
  </div>
);

export default function Display() {
  const { username } = useOutletContext<{ username: string }>();
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'horas' | 'ausencias'>('horas');
  const [rows, setRows] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username) {
      axios.get(createApiUrl(apiConfig.endpoints.userId), { params: { email: username } })
        .then(res => setUserId(res.data?.user_id || null))
        .catch(() => setUserId(null));
    }
  }, [username]);

  useEffect(() => {
    if (userId !== null) {
      setLoading(true);
      if (activeTab === 'horas') {
        axios.get(createApiUrl(apiConfig.endpoints.userTimesheet), { params: { user_id: userId } })
          .then(res => {
            const mapped = (res.data || []).map((row: any) => ({
              inicio: row.start_date ? row.start_date.slice(0, 10) : '',
              fim: row.end_date ? row.end_date.slice(0, 10) : '',
              totalHoras: formatHoursToHM(row.hours),
              descricao: row.description
            }));
            setRows(mapped);
          })
          .catch(() => setRows([]))
          .finally(() => setLoading(false));
      } else if (activeTab === 'ausencias') {
        axios.get(createApiUrl(apiConfig.endpoints.userAbsences), { params: { user_id: userId } })
          .then(res => {
            const mapped = (res.data || []).map((row: any) => ({
              inicio: row.start_date ? row.start_date.slice(0, 10) : '',
              fim: row.end_date ? row.end_date.slice(0, 10) : '',
              tipoAusencia: row.absence_type,
              descricao: row.description
            }));
            setRows(mapped);
          })
          .catch(() => setRows([]))
          .finally(() => setLoading(false));
      }
    }
  }, [userId, activeTab]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="min-h-screen bg-gradient-to-br  p-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600">{username}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              <DataCard 
                icon={Calendar} 
                title="Registos" 
                value={rows.length} 
                subtitle={activeTab === 'horas' ? 'Entradas de tempo' : 'Ausências'}
                color="blue"
              />
              
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white rounded-2xl p-2 shadow-sm mb-6 w-fit">
            <button
              onClick={() => setActiveTab('horas')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'horas'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Horas Registadas
            </button>
            
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                {activeTab === 'horas' ? <Clock className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">A carregar dados...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  {activeTab === 'horas' ? <Clock className="w-16 h-16 mx-auto" /> : <UserX className="w-16 h-16 mx-auto" />}
                </div>
                <p className="text-gray-600 text-lg">Nenhum registo encontrado</p>
                <p className="text-gray-500">
                  {activeTab === 'horas' 
                    ? 'Não há horas registadas para este período'
                    : 'Não há ausências registadas para este período'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 border-b border-gray-200">
                  <div className="font-semibold text-gray-700">Início</div>
                  <div className="font-semibold text-gray-700">Fim</div>
                  <div className="font-semibold text-gray-700">
                    {activeTab === 'horas' ? 'Horas' : 'Tipo'}
                  </div>
                  <div className="font-semibold text-gray-700">Descrição</div>
                </div>

                {/* Table Body */}
                <div className="max-h-96 overflow-y-auto">
                  {rows.map((row, index) => (
                    <div 
                      key={index} 
                      className={`grid grid-cols-4 gap-4 p-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Início</span>
                        <span className="font-medium text-gray-800">{row.inicio}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Fim</span>
                        <span className="font-medium text-gray-800">{row.fim}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          {activeTab === 'horas' ? 'Horas' : 'Tipo'}
                        </span>
                        <span className={`font-medium ${activeTab === 'horas' ? 'text-green-600' : 'text-orange-600'}`}>
                          {activeTab === 'horas' ? row.totalHoras : row.tipoAusencia}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Descrição</span>
                        <span className="font-medium text-gray-800 truncate" title={row.descricao}>
                          {row.descricao}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Dashboard de Gestão de Tempo • Última atualização: {new Date().toLocaleString('pt-PT')}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}