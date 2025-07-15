import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';

interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  time: string;
  description: string;
  location: string;
  attendees: string;
  color: string;
}

const CalendarioModerno = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Array<Event>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(createApiUrl(apiConfig.endpoints.absences));
      // Transform the response data to match our Event interface if necessary
      const formattedEvents = response.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        time: event.time || '',
        description: event.description || '',
        location: event.location || '',
        attendees: event.attendees || '',
        color: event.color || 'from-blue-400 to-blue-600'
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      // You might want to add some UI feedback here
    } finally {
      setLoading(false);
    }
  };

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    time: '',
    description: '',
    location: '',
    attendees: '',
    color: 'from-blue-400 to-blue-600'
  });

  const colors = [
    { name: 'Azul', value: 'from-blue-400 to-blue-600' },
    { name: 'Verde', value: 'from-emerald-400 to-emerald-600' },
    { name: 'Roxo', value: 'from-purple-400 to-purple-600' },
    { name: 'Vermelho', value: 'from-red-400 to-red-600' },
    { name: 'Amarelo', value: 'from-amber-400 to-amber-600' },
    { name: 'Rosa', value: 'from-pink-400 to-pink-600' },
    { name: 'Índigo', value: 'from-indigo-400 to-indigo-600' },
    { name: 'Teal', value: 'from-teal-400 to-teal-600' }
  ];

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    return days;
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = formatDate(date);
    return events.filter(event => dateStr >= event.startDate && dateStr <= event.endDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date): void => {
    const formatted = formatDate(date);
    setEventForm({
      title: '',
      startDate: formatted,
      endDate: formatted,
      time: '',
      description: '',
      location: '',
      attendees: '',
      color: 'from-blue-400 to-blue-600'
    });
    setIsEditing(false);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent): void => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEventForm(event);
    setIsEditing(true);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (): Promise<void> => {
    if (!eventForm.title.trim()) {
      alert('Por favor, insira um título para o evento');
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing && selectedEvent) {
        // Update existing event
        const response = await axios.put(
          createApiUrl(`${apiConfig.endpoints.absences}/${selectedEvent.id}`),
          eventForm,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.status === 200) {
          const updatedEvent = response.data;
          // Immediately update the local state with the updated event
          setEvents(prevEvents => 
            prevEvents.map(event => 
              event.id === selectedEvent.id ? updatedEvent : event
            )
          );
        }
      } else {
        // Create new event
        const response = await axios.post(
          createApiUrl(apiConfig.endpoints.absences),
          eventForm,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.status === 201 || response.status === 200) {
          const newEvent = response.data;
          // Immediately update the local state with the new event
          setEvents(prevEvents => [...prevEvents, newEvent]);
        }
      }
      
      setShowEventModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save event:', error);
      alert(error.response?.data?.message || 'Falha ao salvar o evento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (): Promise<void> => {
    if (!selectedEvent) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        createApiUrl(`${apiConfig.endpoints.absences}/${selectedEvent.id}`),
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 || response.status === 204) {
        // Remove the event from local state
        setEvents(events.filter(event => event.id !== selectedEvent.id));
        setShowEventModal(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      alert(error.response?.data?.message || 'Failed to delete event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setEventForm({
      title: '',
      startDate: '',
      endDate: '',
      time: '',
      description: '',
      location: '',
      attendees: '',
      color: 'from-blue-400 to-blue-600'
    });
    setSelectedEvent(null);
    setIsEditing(false);
  };

  const navigateMonth = (dir: number): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-8">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-xl shadow-xl">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
        >
          <div className="flex justify-between items-center ">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              
            </div>
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateMonth(-1)} 
                className="p-3 bg-gradient-to-r bg-blue-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentDate(new Date())}
                className="px-6 py-3 bg-gradient-to-r bg-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                Hoje
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateMonth(1)} 
                className="p-3 bg-gradient-to-r bg-blue-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
        >
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-4">
            {getDaysInMonth(currentDate).map((day, idx) => {
              const dayEvents = getEventsForDate(day.date);
              const isCurrentDay = isToday(day.date);
              
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                  className={`
                    p-3 rounded-xl min-h-[100px] relative cursor-pointer transition-all duration-300
                    ${day.isCurrentMonth 
                      ? (isCurrentDay 
                          ? 'bg-blue-400 text-white shadow-lg' 
                          : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 shadow-md hover:shadow-lg') 
                      : 'bg-gray-50 text-gray-400'}
                    border border-gray-100
                  `}
                >
                  <div className={`text-sm font-semibold mb-2 ${isCurrentDay ? 'text-white' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(ev => (
                      <motion.div
                        key={ev.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => handleEventClick(ev, e)}
                        className={`text-xs text-white px-2 py-1 rounded-lg truncate bg-gradient-to-r ${ev.color} shadow-sm cursor-pointer`}
                      >
                        {ev.time && <Clock size={10} className="inline mr-1" />}
                        {ev.title}
                      </motion.div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 2} mais
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Event Modal */}
        <AnimatePresence>
          {showEventModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      {isEditing ? 'Editar Evento' : 'Novo Evento'}
                    </h2>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowEventModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input 
                      type="text" 
                      value={eventForm.title} 
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
                      placeholder="Nome do evento"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                      <input 
                        type="date" 
                        value={eventForm.startDate} 
                        onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} 
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                      <input 
                        type="date" 
                        value={eventForm.endDate} 
                        onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} 
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Horário
                    </label>
                    <input 
                      type="time" 
                      value={eventForm.time} 
                      onChange={e => setEventForm({ ...eventForm, time: e.target.value })} 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Local
                    </label>
                    <input 
                      type="text" 
                      value={eventForm.location} 
                      onChange={e => setEventForm({ ...eventForm, location: e.target.value })} 
                      placeholder="Local do evento"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-1" />
                      Participantes
                    </label>
                    <input 
                      type="text" 
                      value={eventForm.attendees} 
                      onChange={e => setEventForm({ ...eventForm, attendees: e.target.value })} 
                      placeholder="Lista de participantes"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea 
                      value={eventForm.description} 
                      onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
                      placeholder="Descrição do evento"
                      rows={3}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cor do Evento</label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <motion.button 
                          key={c.value}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEventForm({ ...eventForm, color: c.value })} 
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${c.value} shadow-md ${eventForm.color === c.value ? 'ring-2 ring-gray-800 ring-offset-2' : ''}`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                  {isEditing && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteEvent} 
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    >
                      <Trash2 size={16} className="inline mr-2" />
                      Excluir
                    </motion.button>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEventModal(false)} 
                    className="bg-gray-500 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEvent} 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  >
                    {isEditing ? 'Salvar' : 'Criar'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarioModerno;