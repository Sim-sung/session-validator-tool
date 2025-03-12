
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { getApiUrl } from '@/utils/environments';

interface AuthState {
  apiToken: string;
  companyId: string;
  username: string;
  environment: string;
  isAuthenticated: boolean;
  isValidating: boolean;
  saveCredentials: (credentials: { 
    apiToken: string; 
    companyId: string; 
    username: string;
    environment: string;
  }) => void;
  validateCredentials: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const LOCAL_STORAGE_KEY = 'gamebench-credentials';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiToken, setApiToken] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [username, setUsername] = useState('');
  const [environment, setEnvironment] = useState('https://api.gamebench.net');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const savedCredentials = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedCredentials) {
      try {
        const { apiToken, companyId, username, environment } = JSON.parse(savedCredentials);
        setApiToken(apiToken || '');
        setCompanyId(companyId || '');
        setUsername(username || '');
        setEnvironment(environment || 'https://api.gamebench.net');
      } catch (error) {
        console.error('Failed to parse saved credentials:', error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  const saveCredentials = ({ 
    apiToken, 
    companyId, 
    username, 
    environment 
  }: { 
    apiToken: string; 
    companyId: string; 
    username: string;
    environment: string;
  }) => {
    setApiToken(apiToken);
    setCompanyId(companyId);
    setUsername(username);
    setEnvironment(environment);
    
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ apiToken, companyId, username, environment })
    );
  };

  const validateCredentials = async (): Promise<boolean> => {
    if (!apiToken) {
      toast.error('API Token is required');
      return false;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch(`${getApiUrl(environment)}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success('API credentials validated successfully');
        return true;
      } else {
        setIsAuthenticated(false);
        
        if (response.status === 401) {
          toast.error('Invalid API credentials - Authentication failed');
        } else if (response.status === 403) {
          toast.error('Permission denied - Check your access rights');
        } else {
          toast.error(`API validation failed (${response.status})`);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      setIsAuthenticated(false);
      toast.error('Failed to validate API credentials - Network or server error');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const logout = () => {
    setApiToken('');
    setCompanyId('');
    setUsername('');
    setEnvironment('https://api.gamebench.net');
    setIsAuthenticated(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        apiToken,
        companyId,
        username,
        environment,
        isAuthenticated,
        isValidating,
        saveCredentials,
        validateCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
