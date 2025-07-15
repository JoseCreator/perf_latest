import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./contexts/UserContext";
import { createApiUrl, apiConfig } from "../utils/apiConfig";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { setUsername: setUsernameContext } = useContext(UserContext);

  // Clear any stored credentials on component mount for security
  useEffect(() => {
    localStorage.removeItem('username');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    if (!username.trim() || !password) {
      setLoginError("Username and password required");
      return;
    }
    
    try {
      console.log('🔍 Attempting login...');
      console.log('API URL:', createApiUrl(apiConfig.endpoints.login));
      console.log('Username:', username);
      
      const response = await axios.post(createApiUrl(apiConfig.endpoints.login), {
        username,
        password,
      });
      
      console.log('✅ Login successful!', response.data);
      
      // Store the JWT token in localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Token stored in localStorage');
      }
      
      setUsernameContext(username); // Set username in context for MainPage
      navigate("/main");
      
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);
      
      if (err.code === 'ERR_NETWORK') {
        setLoginError("Cannot connect to server. Please check your internet connection.");
      } else if (err.response?.status === 401) {
        setLoginError("Invalid email or password");
      } else if (err.response?.data?.error) {
        setLoginError(err.response.data.error);
      } else {
        setLoginError(`Login failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <div className="text-lg font-bold mb-1">Email</div>
        <div className="flex mb-4">
          <input
            className="border flex-1 px-2 py-1 mr-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your email..."
            type="email"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div className="text-lg font-bold mb-1">Password</div>
        <div className="flex mb-4">
          <input
            className="border flex-1 px-2 py-1 mr-2 rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password..."
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div className="pt-4 pr-8 content-center flex flex-col items-center">
          <button
            onClick={handleLogin}
            className="bg-blue-400 text-white px-4 py-2 rounded-2xl w-1/3 hover:bg-blue-500 transition-colors hover:text-lg"
          >
            Login
          </button>
        </div>
        {loginError && (
          <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-center">
            {loginError}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;