import Avatar from '@mui/joy/Avatar';
import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../../utils/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';



function SettingsPerfil() {
  const { user_id } = useOutletContext<{ user_id: number | null }>();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  return (
    <>
    <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="min-h-screen bg-gradient-to-br to-indigo-100 p-4"
          >

    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-6">
      <div className="bg-white/80 backdrop-blur-sm w-full max-w-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Configurações de Perfil</h2>
          <div className="relative inline-block">
            <Avatar 
              alt="User" 
              src="/avatar1.png" 
              sx={{ 
                border: '4px solid rgba(255,255,255,0.3)',
                width: '100px', 
                height: '100px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="p-8 space-y-8">
          {/* Seção Change Password */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mudar Password</h3>
              <p className="text-sm text-gray-500">Atualiza a segurança da sua conta</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="Nova Password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={async () => {
                  try {
                    if (!newPassword.trim()) {
                      setError('Please enter a new password');
                      return;
                    }
                    if (!user_id) {
                      setError('User not found');
                      return;
                    }
                    const response = await axios.post(createApiUrl(apiConfig.endpoints.changePassword), {
                      user_id,
                      newPassword
                    });
                    setMessage(response.data.message);
                    setError('');
                    setNewPassword('');
                  } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to change password');
                    setMessage('');
                  }
                }}
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Update Password</span>
                </span>
              </button>
            </div>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Imagem de Perfil</span>
            </div>
          </div>

          {/* Seção Change Picture */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Imagem de Perfil</h3>
              <p className="text-sm text-gray-500">Upload nova imagem de perfil</p>
            </div>
            
            <button className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transform hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md">
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Mudar Fotografia</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
    </AnimatePresence>
    </>
  );
}

export default SettingsPerfil;