import './App.css';
import LoginPage from './assets/LoginPage';
import MainPage from './assets/MainPage';
import RegistarHoras from './assets/RegistarHoras';
import Display from './assets/Display';
import { Routes, Route, useLocation } from 'react-router-dom';
import Calendario from './assets/Calendario';
import { UserProvider } from './assets/contexts/UserContext';
import Pessoal from './assets/Pessoal';
import SettingsPerfil from './assets/contexts/SettingsPerfil';
import PerformClientes from './assets/PerformClientes';
import Configurações from './assets/Configurações';
import GitHub from './assets/GitHub';
import { useEffect } from 'react';

function AppContent() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('🗺️ Route changed to:', location.pathname);
    if (location.pathname.includes('gitHub')) {
      console.log('🎯 GitHub route detected!');
    }
  }, [location.pathname]);

  return (
    <div className='custom-bg h-screen'>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/main/*' element={<MainPage />}>
          <Route path='registar/registo' element={<RegistarHoras />} />
          <Route path='registar/display' element={<Display />} />
          <Route path='calendario' element={<Calendario />} />
          <Route path='settings/perfil' element={<SettingsPerfil />} />
          <Route path='settings/configuracoes' element={<Configurações />} />
          <Route path='diagramas/MyPerform' element={<Pessoal />}/>
          <Route path='diagramas/relatorios' element={<PerformClientes />} />
          <Route path='gitHub/githubprojetos' element={<GitHub />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <UserProvider> 
      <AppContent />
    </UserProvider>
  );
}

export default App;
