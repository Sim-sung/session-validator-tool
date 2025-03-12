
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
  // Adding properties used in Sessions.tsx
  appName?: string;
  appVersion?: string;
  deviceModel?: string;
  manufacturer?: string;
  recordedBy?: string;
}

// Define SessionMetrics interface for use in Metrics.tsx
export interface SessionMetrics {
  appDetails: {
    name: string;
    version: string;
    package: string;
  };
  deviceDetails: {
    model: string;
    manufacturer: string;
    gpuType: string;
  };
  userDetails: {
    email: string;
    username: string;
  };
  timestamp: number;
  duration: number;
  fps?: number[];
  cpu?: number[];
  gpu?: number[];
  battery?: number[];
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
  fetchSessionMetrics: (sessionId: string) => Promise<SessionMetrics | null>;
  saveSessionMetricsForValidation: (metrics: SessionMetrics) => void;
  setSessions: (sessions: Session[]) => void; // Added this function
}

// Export the context and its hook
export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
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
        // Adding properties used in Sessions.tsx
        appName: `Test App ${index % 3 + 1}`,
        appVersion: `1.${index % 5}`,
        deviceModel: `Model ${['A', 'B', 'C'][index % 3]}`,
        manufacturer: `Manufacturer ${['X', 'Y', 'Z'][index % 3]}`,
        recordedBy: `user${index % 3 + 1}@example.com`,
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

  // Mock function to fetch session metrics
  const fetchSessionMetrics = async (sessionId: string): Promise<SessionMetrics | null> => {
    if (!apiToken) {
      toast.error('API Token is required');
      return null;
    }

    try {
      // In a real implementation, this would call the GameBench API
      // For now, we'll just simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock metrics data
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        toast.error('Session not found');
        return null;
      }
      
      const mockMetrics: SessionMetrics = {
        appDetails: {
          name: session.app.name,
          version: session.app.version,
          package: session.app.package,
        },
        deviceDetails: {
          model: session.device.model,
          manufacturer: session.device.manufacturer,
          gpuType: 'Mock GPU Type',
        },
        userDetails: {
          email: session.userEmail,
          username: session.userEmail.split('@')[0],
        },
        timestamp: session.startTime,
        duration: session.duration,
        fps: Array(30).fill(0).map(() => 30 + Math.random() * 30),
        cpu: Array(30).fill(0).map(() => 10 + Math.random() * 50),
        gpu: Array(30).fill(0).map(() => 5 + Math.random() * 95),
        battery: Array(30).fill(0).map((_, i) => 100 - (i * 0.5) - Math.random()),
      };
      
      toast.success('Session metrics loaded');
      return mockMetrics;
    } catch (error) {
      console.error('Error fetching session metrics:', error);
      toast.error('Failed to fetch session metrics');
      return null;
    }
  };

  // Mock function to save session metrics for validation
  const saveSessionMetricsForValidation = (metrics: SessionMetrics) => {
    // In a real implementation, this would save to local storage or a database
    toast.success('Session metrics saved for validation');
    console.log('Metrics saved for validation:', metrics);
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
        fetchSessionMetrics,
        saveSessionMetricsForValidation,
        setSessions, // Add this to the context value
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
