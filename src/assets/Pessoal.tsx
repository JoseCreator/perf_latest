import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import Autocomplete from '@mui/joy/Autocomplete';


export default function Pessoal() {
  const { user_id } = useOutletContext<{ user_id: number | null }>();
  const [, setProgressWidth] = useState(0);
  const selectedMonth = 0; // 0-11 for Jan-Dec
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectOptions, setProjectOptions] = useState<{ label: string; id: number }[]>([]);
  const [selectedProject, setSelectedProject] = useState<{ label: string; id: number } | null>(null);
  const [pieData, setPieData] = useState<{ id: number; value: number; label: string }[]>([]);
  const [totalProjectHours, setTotalProjectHours] = useState<number>(0);
  const [availableHours, setAvailableHours] = useState<number | null>(null);
  const [horasNormais, setHorasNormais] = useState<number>(0);
  const [horasFaturaveis, setHorasFaturaveis] = useState<number>(0);
  const [horasExtra, setHorasExtra] = useState<number>(0);

  const images = ['/graph2.png', '/piecharts1.png'];

  // Removed unused function valueText and clampedProgress variable

  useEffect(() => {
    if (!user_id) return;
    const year = 2025;
    const month = selectedMonth;
    const start = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    axios.get(createApiUrl(apiConfig.endpoints.userMonthHours), {
      params: { user_id, start, end }
    })
      .then(res => {
        const total = res.data?.total || 0;
        const percent = Math.floor((total / 176) * 100);
        setProgressWidth(percent);
      })
      .catch(() => setProgressWidth(0));
  }, [user_id, selectedMonth]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user_id) return;
    axios.get(createApiUrl(apiConfig.endpoints.projectsByUser), { params: { user_id } })
      .then(res => {
        const projects = res.data?.projects || [];
        setProjectOptions(projects.map((name: string, idx: number) => ({ label: name, id: idx })));
      })
      .catch(() => setProjectOptions([]));
  }, [user_id]);

  useEffect(() => {
    if (projectOptions.length > 0 && !selectedProject) {
      setSelectedProject(projectOptions[0]);
    }
  }, [projectOptions]);

  useEffect(() => {
    if (!selectedProject) {
      setPieData([]);
      setTotalProjectHours(0);
      return;
    }
    // 1. Get project_id by project_name
    axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedProject.label } })
      .then(res => {
        const project_id = res.data?.project_id;
        if (!project_id) {
          setPieData([]);
          setTotalProjectHours(0);
          return;
        }
        // 2. Get people and hours for this project
        axios.get(createApiUrl(apiConfig.endpoints.projectPeopleHours), { params: { project_id } })
          .then(res2 => {
            setPieData(res2.data?.people || []);
            setTotalProjectHours(res2.data?.totalHours || 0);
          })
          .catch(() => {
            setPieData([]);
            setTotalProjectHours(0);
          });
      })
      .catch(() => {
        setPieData([]);
        setTotalProjectHours(0);
      });
  }, [selectedProject]);

  useEffect(() => {
    if (!user_id) return;
    axios.get(createApiUrl(apiConfig.endpoints.userAvailableHours), { params: { user_id } })
      .then(res => {
        setAvailableHours(res.data.availableHours);
      })
      .catch(() => {
        setAvailableHours(null);
      });
  }, [user_id]);

  useEffect(() => {
    if (!user_id || !selectedProject) {
      setHorasNormais(0);
      setHorasFaturaveis(0);
      setHorasExtra(0);
      return;
    }
    axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedProject.label } })
      .then(res => {
        const project_id = res.data?.project_id;
        if (!project_id) {
          setHorasNormais(0);
          setHorasFaturaveis(0);
          setHorasExtra(0);
          return;
        }
        axios.get(createApiUrl(apiConfig.endpoints.projectHoursBreakdown), { params: { user_id, project_id } })
          .then(res2 => {
            setHorasNormais(res2.data?.horasNormais || 0);
            setHorasFaturaveis(res2.data?.horasFaturaveis || 0);
            setHorasExtra(res2.data?.horasExtra || 0);
          })
          .catch(() => {
            setHorasNormais(0);
            setHorasFaturaveis(0);
            setHorasExtra(0);
          });
      })
      .catch(() => {
        setHorasNormais(0);
        setHorasFaturaveis(0);
        setHorasExtra(0);
      });
  }, [user_id, selectedProject]);

  const faturacaoPercent = (horasNormais > 0) ? Math.round((horasFaturaveis / horasNormais) * 100) : 0;
const extrasPercent = (horasNormais > 0) ? Math.round((horasExtra / horasNormais) * 100) : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header Section - Responsive */}
     <div className="px-4 sm:px-6 lg:px-8">
  {/* Header Section - Responsive */}
  <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full">
    <div className="w-full lg:w-10/12 text-sm sm:text-lg h-auto lg:h-16 bg-gradient-to-r from-yellow-500 border shadow-lg rounded-2xl lg:rounded-full font-bold text-gray-500">
      <div className="flex flex-col lg:flex-row lg:justify-around items-center h-full w-full px-4 py-3 lg:py-0 gap-3 lg:gap-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
          <div className="text-center sm:text-left">
            Projeto:
          </div>
          <div>
            <Autocomplete
              placeholder="Projeto..."
              options={projectOptions}
              value={selectedProject}
              onChange={(_, v) => setSelectedProject(v)}
              getOptionLabel={(option) => option?.label || ''}
              sx={{ width: { xs: 180, sm: 200, md: 220 } }}
            />
          </div>
        </div>
        

<div className="relative h-12 sm:h-16 flex items-center justify-center">
  <AnimatePresence mode="wait">
    <motion.img
      key={images[currentImageIndex]}
      src={images[currentImageIndex]}
      alt="slider"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-8 sm:h-12 object-contain"
    />
  </AnimatePresence>
</div>
      </div>
    </div>
  </div>
</div>

      
      {/* Cards Section - Responsive */}
      <div className='flex flex-col lg:flex-row gap-4 lg:gap-8 justify-center mt-6 lg:mt-9'>
        <div className='p-4 sm:p-6 mb-4 lg:mb-8 rounded-2xl bg-white w-full lg:w-1/4 shadow-lg'>
          <div className='flex flex-row'><div className='font-bold text-lg sm:text-xl mb-3'>Registo de Horas </div><div className='text-xl'>👤</div></div>
         
          <div className='flex flex-row justify-around pt-3 lg:pt-5'>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Minhas Horas </div>
              <div className='font-bold text-2xl sm:text-4xl'>{faturacaoPercent} H</div>
            </div>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Eficásia</div>
              <div className='font-bold text-2xl sm:text-4xl'>{extrasPercent} %</div>
            </div>
          </div>
        </div>

        

        <div className='p-4 sm:p-6 mb-4 lg:mb-8 rounded-2xl bg-white w-full lg:w-1/4 shadow-lg'>
          <div className='flex flex-row'><div className='font-bold text-lg sm:text-xl mb-3'>Percentagem de Horas </div><div className='text-xl'>👤</div></div>
          <div className='flex flex-row justify-around pt-3 lg:pt-5'>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Faturação</div>
              <div className='font-bold text-2xl sm:text-4xl'>{faturacaoPercent} %</div>
            </div>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Extras</div>
              <div className='font-bold text-2xl sm:text-4xl'>{extrasPercent} %</div>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-6 mb-4 lg:mb-8 rounded-2xl bg-white w-full lg:w-1/4 shadow-lg'>
          <div className='flex flex-row'><div className='font-bold text-lg sm:text-xl mb-3'>Dias de Ausencia / Ferias </div><div className='text-xl'>👤</div></div>
          <div className='flex flex-row justify-around pt-3 lg:pt-5'>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Ferias </div>
              <div className='font-bold text-2xl sm:text-4xl'>{faturacaoPercent}</div>
            </div>
            <div className="text-center">
              <div className='font-bold text-lg sm:text-xl text-gray-500'>Ausencias</div>
              <div className='font-bold text-2xl sm:text-4xl'>{extrasPercent} </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Charts Section - Responsive */}
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-8 justify-center items-start mb-6 lg:mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col w-full xl:w-1/3">
          <div className='justify-start font-bold text-lg sm:text-xl mb-4'>
            Horas do Projeto
          </div>
          <div className='flex justify-center items-center'>
            <PieChart
              series={[
                {
                  data: pieData,
                },
              ]}
              width={200}
              height={350}
            />
          </div>
          <div className='font-bold text-lg sm:text-xl text-gray-500 mt-4'>
            Horas totais
          </div>
          <div className='font-bold text-2xl sm:text-4xl text-gray-700'>{totalProjectHours}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-2 sm:p-4 flex-1 w-full xl:max-w-[688px] min-h-[400px] xl:h-[476px]">
          <div className='font-bold text-lg sm:text-xl mb-4'>Distribuição de Horas</div>          
          <div className="overflow-x-auto">
            <BarChart
              xAxis={[{ data: [''] }]}
              series={[
                { data: [Math.round(availableHours !== null ? availableHours : 0)], color: '#FEEDC3' },
                { data: [80], color: '#E87461' },
                { data: [Math.round(horasNormais)], color: '#4ade80' },
                { data: [Math.round(horasFaturaveis)], color: '#60a5fa' },
                { data: [Math.round(horasExtra)], color: '#fbbf24' }
              ]}
              height={250}
              barLabel="value"
            />
          </div>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-5 items-center justify-center mt-4 mb-2 text-xs sm:text-sm'>
            <div className='flex flex-row items-center gap-1'>
              <div className='w-5 h-5 sm:w-7 sm:h-7 bg-[#FEEDC3] rounded-full'></div>
              <div className='font-semibold text-gray-600'>Horas Disponíveis</div>
            </div>
            <div className='flex flex-col gap-2 sm:gap-3'>
              <div className='flex flex-row items-center gap-1'>
                <div className='w-5 h-5 sm:w-7 sm:h-7 bg-[#E87461] rounded-full'></div>
                <div className='font-semibold text-gray-600'>Horas Registadas</div>
              </div>
              <div className='flex flex-row items-center gap-1'>
                <div className='w-5 h-5 sm:w-7 sm:h-7 bg-green-300 rounded-full'></div>
                <div className='font-semibold text-gray-600'>Horas Normais</div>
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:gap-3'>
              <div>
                <div className='flex flex-row items-center gap-1'>
                  <div className='w-5 h-5 sm:w-7 sm:h-7 bg-blue-400 rounded-full'></div>
                  <div className='font-semibold text-gray-600'>Horas Faturáveis</div>
                </div>
              </div>
              <div>
                <div className='flex flex-row items-center gap-1'>
                  <div className='w-5 h-5 sm:w-7 sm:h-7 bg-yellow-400 rounded-full'></div>
                  <div className='font-semibold text-gray-600'>Horas Extra</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
