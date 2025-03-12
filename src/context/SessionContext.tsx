
import React, { createContext, useContext, useState } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';

// Define session type based on GameBench API
export interface Session {
  id: string;
  app: {
    name: string;
    version: string;
    package: string;
  };
  device: {
    model: string;
    manufacturer: string;
  };
  metrics?: {
    fps?: {
      avg: number;
      stability: number;
    };
    cpu?: {
      avg: number;
    };
    memory?: {
      avg: number;
    };
    battery?: {
      drain: number;
    };
  };
  startTime: number;
  duration: number;
  userEmail: string;
  selected?: boolean;
}

export interface SessionSearchParams {
  dateStart?: number;
  dateEnd?: number;
  apps?: string[];
  devices?: string[];
  manufacturers?: string[];
  page?: number;
  pageSize?: number;
  sort?: string;
}

interface SessionContextType {
  sessions: Session[];
  isLoading: boolean;
  totalSessions: number;
  currentPage: number;
  selectedSessions: Session[];
  searchParams: SessionSearchParams;
  fetchSessions: (params?: SessionSearchParams) => Promise<void>;
  selectSession: (sessionId: string, selected: boolean) => void;
  selectAllSessions: (selected: boolean) => void;
  setSearchParams: (params: SessionSearchParams) => void;
  resetSearchParams: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};

// Default search parameters
const defaultSearchParams: SessionSearchParams = {
  dateStart: undefined,
  dateEnd: undefined,
  apps: [],
  devices: [],
  manufacturers: [],
  page: 0,
  pageSize: 15,
  sort: 'timePushed:desc',
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiToken, companyId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchParams, setSearchParams] = useState<SessionSearchParams>(defaultSearchParams);

  // Mock function to fetch sessions - replace with actual API call
  const fetchSessions = async (params?: SessionSearchParams) => {
    if (!apiToken) {
      toast.error('API Token is required');
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the GameBench API
      // For now, we'll just simulate a response
      const mergedParams = { ...searchParams, ...params };
      setSearchParams(mergedParams);
      
      // Simulated API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      const mockSessions: Session[] = Array(15).fill(null).map((_, index) => ({
        id: `session-${index + 1}`,
        app: {
          name: `Test App ${index % 3 + 1}`,
          version: `1.${index % 5}`,
          package: `com.testapp.app${index % 3 + 1}`,
        },
        device: {
          model: `Model ${['A', 'B', 'C'][index % 3]}`,
          manufacturer: `Manufacturer ${['X', 'Y', 'Z'][index % 3]}`,
        },
        metrics: {
          fps: {
            avg: 55 + Math.random() * 5,
            stability: 85 + Math.random() * 15,
          },
          cpu: {
            avg: 25 + Math.random() * 15,
          },
          memory: {
            avg: 250 + Math.random() * 100,
          },
          battery: {
            drain: 0.5 + Math.random() * 1.5,
          },
        },
        startTime: Date.now() - (index * 1000 * 60 * 60 * 24),
        duration: 300 + Math.round(Math.random() * 600),
        userEmail: `user${index % 3 + 1}@example.com`,
        selected: false,
      }));
      
      setSessions(mockSessions);
      setTotalSessions(100); // Mock total
      setCurrentPage(mergedParams.page || 0);
      
      toast.success(`Loaded ${mockSessions.length} sessions`);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (sessionId: string, selected: boolean) => {
    setSessions(sessions.map(session => 
      session.id === sessionId ? { ...session, selected } : session
    ));
  };

  const selectAllSessions = (selected: boolean) => {
    setSessions(sessions.map(session => ({ ...session, selected })));
  };

  const resetSearchParams = () => {
    setSearchParams(defaultSearchParams);
  };

  // Compute selected sessions
  const selectedSessions = sessions.filter(session => session.selected);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        isLoading,
        totalSessions,
        currentPage,
        selectedSessions,
        searchParams,
        fetchSessions,
        selectSession,
        selectAllSessions,
        setSearchParams,
        resetSearchParams,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
