
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
  const [environment, setEnvironment] = useState('https://web.gamebench.net');
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

    if (!username) {
      toast.error('Username is required');
      return false;
    }

    if (!environment) {
      toast.error('Environment URL is required');
      return false;
    }

    setIsValidating(true);
    
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: Server did not respond within 10 seconds')), 10000);
    });
    
    try {
      const apiUrl = getApiUrl(environment);
      // Test authentication using the sessions endpoint with pageSize=1
      const testUrl = `${apiUrl}/sessions?pageSize=1`;
      console.log('Attempting to validate credentials with URL:', testUrl);
      
      const response = await Promise.race([
        fetch(testUrl, {
          method: 'POST',
          headers: {
            'Authorization': createBasicAuth(username, apiToken),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "apps": [],
            "devices": [],
            "manufacturers": []
          })
        }),
        timeoutPromise
      ]);

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success('API credentials validated successfully');
        return true;
      } else {
        setIsAuthenticated(false);
        
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch (e) {
          errorDetails = `Status: ${response.status} - ${response.statusText}`;
        }
        
        let userMessage = '';
        if (response.status === 401) {
          userMessage = 'Invalid credentials - Please check your username and API token';
        } else if (response.status === 403) {
          userMessage = 'Permission denied - Check your access rights';
        } else {
          userMessage = `API validation failed (${response.status})`;
        }
        
        toast.error(userMessage, {
          description: `Technical details:\n${errorDetails}`,
          duration: 10000
        });
        return false;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      setIsAuthenticated(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to validate API credentials', {
        description: `Technical details: ${errorMessage}`,
        duration: 10000
      });
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
