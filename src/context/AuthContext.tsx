import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

interface AuthState {
  apiToken: string;
  companyId: string;
  username: string;
  isAuthenticated: boolean;
  isValidating: boolean;
  saveCredentials: (credentials: { apiToken: string; companyId: string; username: string }) => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load credentials from localStorage on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedCredentials) {
      try {
        const { apiToken, companyId, username } = JSON.parse(savedCredentials);
        setApiToken(apiToken || '');
        setCompanyId(companyId || '');
        setUsername(username || '');
        
        // We don't automatically validate here - user must click connect
        // This prevents unwanted API calls on page load
      } catch (error) {
        console.error('Failed to parse saved credentials:', error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  const saveCredentials = ({ apiToken, companyId, username }: { apiToken: string; companyId: string; username: string }) => {
    setApiToken(apiToken);
    setCompanyId(companyId);
    setUsername(username);
    
    // Save to localStorage
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ apiToken, companyId, username })
    );
  };

  const validateCredentials = async (): Promise<boolean> => {
    if (!apiToken) {
      toast.error('API Token is required');
      return false;
    }

    setIsValidating(true);
    
    try {
      // Just a mock API validation for now
      // In a real application, this would call the actual GameBench API
      const response = await new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1500);
      });

      if (response.success) {
        setIsAuthenticated(true);
        toast.success('API credentials validated successfully');
        return true;
      } else {
        setIsAuthenticated(false);
        toast.error('Invalid API credentials');
        return false;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      toast.error('Failed to validate API credentials');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const logout = () => {
    setApiToken('');
    setCompanyId('');
    setUsername('');
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
