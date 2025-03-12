
import React, { createContext, useContext, useState } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';
import { getApiUrl, createBasicAuth } from '@/utils/environments';

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
  setSessions: (sessions: Session[]) => void;
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
  const { apiToken, username, environment, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchParams, setSearchParams] = useState<SessionSearchParams>(defaultSearchParams);
  const [fetchInProgress, setFetchInProgress] = useState(false); // To prevent multiple simultaneous fetches

  const fetchSessions = async (params?: SessionSearchParams) => {
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping session fetch");
      return;
    }

    if (!apiToken || !username) {
      console.log("Missing credentials, skipping session fetch");
      return;
    }

    // Prevent multiple simultaneous requests
    if (fetchInProgress) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    setFetchInProgress(true);
    setIsLoading(true);
    
    try {
      const mergedParams = { ...searchParams, ...params };
      setSearchParams(mergedParams);
      
      const queryParams = new URLSearchParams();
      
      if (mergedParams.pageSize) {
        queryParams.append('pageSize', mergedParams.pageSize.toString());
      }
      
      if (mergedParams.page !== undefined) {
        queryParams.append('page', mergedParams.page.toString());
      }
      
      if (mergedParams.sort) {
        queryParams.append('sort', mergedParams.sort);
      }
      
      const apiUrl = getApiUrl(environment);
      const url = `${apiUrl}/v1/sessions?${queryParams.toString()}`;
      
      console.log('Fetching sessions with URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': createBasicAuth(username, apiToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "apps": mergedParams.apps || [],
          "devices": mergedParams.devices || [],
          "manufacturers": mergedParams.manufacturers || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map API response to our Session interface
      const mappedSessions = data.sessions.map((session: any) => ({
        id: session.id,
        app: session.app || { name: 'Unknown', version: 'Unknown', package: 'Unknown' },
        device: session.device || { model: 'Unknown', manufacturer: 'Unknown' },
        metrics: session.metrics,
        startTime: session.startTime || Date.now(),
        duration: session.duration || 0,
        userEmail: session.userEmail || 'Unknown',
        // Add derived fields for display
        appName: session.app?.name || 'Unknown',
        appVersion: session.app?.version || 'Unknown',
        deviceModel: session.device?.model || 'Unknown',
        manufacturer: session.device?.manufacturer || 'Unknown',
        recordedBy: session.userEmail || 'Unknown',
        selected: false
      }));
      
      setSessions(mappedSessions);
      setTotalSessions(data.total || 0);
      setCurrentPage(mergedParams.page || 0);
      
      toast.success(`Loaded ${mappedSessions.length} sessions successfully`);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
      setSessions([]);
      setTotalSessions(0);
    } finally {
      setIsLoading(false);
      setFetchInProgress(false);
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

  const fetchSessionMetrics = async (sessionId: string): Promise<SessionMetrics | null> => {
    if (!apiToken || !username || !isAuthenticated) {
      toast.error('Authentication required');
      return null;
    }

    try {
      const apiUrl = getApiUrl(environment);
      const response = await fetch(`${apiUrl}/v1/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': createBasicAuth(username, apiToken),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching session metrics:', error);
      toast.error('Failed to fetch session metrics', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
      return null;
    }
  };

  // Function to save session metrics for validation
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
        setSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
