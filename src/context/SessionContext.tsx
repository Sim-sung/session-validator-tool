
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
  const { apiToken, username, environment, isAuthenticated, companyId } = useAuth();
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
      
      // Always include pageSize
      queryParams.append('pageSize', (mergedParams.pageSize || 15).toString());
      
      // Add page if defined
      if (mergedParams.page !== undefined) {
        queryParams.append('page', mergedParams.page.toString());
      }
      
      // Always include sort parameter
      queryParams.append('sort', mergedParams.sort || 'timePushed:desc');
      
      // Always include company ID if available
      if (companyId) {
        queryParams.append('company', companyId);
      }
      
      const apiUrl = getApiUrl(environment);
      const url = `${apiUrl}/v1/sessions?${queryParams.toString()}`;
      
      console.log('Fetching sessions with URL:', url);
      
      // Prepare the request body exactly as in the curl example
      const requestBody = {
        apps: mergedParams.apps || [],
        devices: mergedParams.devices || [], 
        manufacturers: mergedParams.manufacturers || []
      };
      
      console.log('Request payload:', requestBody);
      
      // Use POST with JSON body for searching sessions (as per API requirement)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': createBasicAuth(username, apiToken),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data) {
        throw new Error('Invalid response: empty data');
      }
      
      // Map API response to our Session interface
      let mappedSessions: Session[] = [];
      
      if (Array.isArray(data.results)) {
        console.log('Processing results array format with', data.results.length, 'items');
        mappedSessions = data.results.map((session: any) => ({
          id: session.id || session.uuid || 'unknown',
          app: {
            name: session.app?.name || 'Unknown',
            version: session.app?.version || 'Unknown',
            package: session.app?.packageName || session.app?.package || 'Unknown'
          },
          device: {
            model: session.device?.model || 'Unknown',
            manufacturer: session.device?.manufacturer || 'Unknown'
          },
          metrics: {
            fps: {
              avg: session.fpsMedian || 0,
              stability: session.fpsStability || 0
            },
            cpu: {
              avg: session.cpuUsageAvg || 0
            },
            memory: {
              avg: session.androidMemUsageAvg || session.memUsageAvg || 0
            },
            battery: {
              drain: session.powerUsage || 0
            }
          },
          startTime: session.sessionDate || session.timePushed || Date.now(),
          duration: session.timePlayed || 0,
          userEmail: session.user?.userPlayAccount || session.originalUser?.userPlayAccount || 'Unknown',
          // Add derived fields for display
          appName: session.app?.name || 'Unknown',
          appVersion: session.app?.version || 'Unknown',
          deviceModel: session.device?.model || 'Unknown',
          manufacturer: session.device?.manufacturer || 'Unknown',
          recordedBy: session.user?.userPlayAccount || session.originalUser?.userPlayAccount || 'Unknown',
          selected: false
        }));
        
        setTotalSessions(data.totalHits || data.totalPages || mappedSessions.length);
      } else if (Array.isArray(data.sessions)) {
        console.log('Processing sessions array format with', data.sessions.length, 'items');
        mappedSessions = data.sessions.map((session: any) => ({
          id: session.id || 'unknown',
          app: {
            name: session.app?.name || 'Unknown',
            version: session.app?.version || 'Unknown',
            package: session.app?.package || 'Unknown'
          },
          device: {
            model: session.device?.model || 'Unknown',
            manufacturer: session.device?.manufacturer || 'Unknown'
          },
          metrics: {
            fps: session.metrics?.fps || undefined,
            cpu: session.metrics?.cpu || undefined,
            memory: session.metrics?.memory || undefined,
            battery: session.metrics?.battery || undefined
          },
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
        
        setTotalSessions(data.total || mappedSessions.length);
      } else {
        // Handle case when API returns a single object or an array without results/sessions wrapper
        console.log('Unexpected API response format, attempting to process raw data');
        
        if (Array.isArray(data)) {
          // If data is a direct array of sessions
          console.log('Processing direct array with', data.length, 'items');
          mappedSessions = data.map((session: any) => ({
            id: session.id || session.uuid || 'unknown',
            app: {
              name: session.app?.name || 'Unknown',
              version: session.app?.version || 'Unknown',
              package: session.app?.packageName || session.app?.package || 'Unknown'
            },
            device: {
              model: session.device?.model || 'Unknown',
              manufacturer: session.device?.manufacturer || 'Unknown'
            },
            metrics: {
              fps: {
                avg: session.fpsMedian || 0,
                stability: session.fpsStability || 0
              },
              cpu: {
                avg: session.cpuUsageAvg || 0
              },
              memory: {
                avg: session.androidMemUsageAvg || session.memUsageAvg || 0
              },
              battery: {
                drain: session.powerUsage || 0
              }
            },
            startTime: session.sessionDate || session.timePushed || Date.now(),
            duration: session.timePlayed || 0,
            userEmail: session.user?.userPlayAccount || session.originalUser?.userPlayAccount || 'Unknown',
            appName: session.app?.name || 'Unknown',
            appVersion: session.app?.version || 'Unknown',
            deviceModel: session.device?.model || 'Unknown',
            manufacturer: session.device?.manufacturer || 'Unknown',
            recordedBy: session.user?.userPlayAccount || session.originalUser?.userPlayAccount || 'Unknown',
            selected: false
          }));
          
          setTotalSessions(mappedSessions.length);
        } else {
          console.warn('Cannot process API response:', data);
          throw new Error('Invalid response format: sessions data not found');
        }
      }
      
      setSessions(mappedSessions);
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
      
      // Construct the proper URL for fetching a specific session
      // Using GET method for fetching single session details
      let url = `${apiUrl}/v1/sessions/${sessionId}`;
      
      // Add company ID as a query parameter if available
      if (companyId) {
        url += `?company=${companyId}`;
      }
      
      console.log(`Fetching session metrics for ID ${sessionId} from ${url}`);
      
      const response = await fetch(url, {
        method: 'GET', // Use GET for fetching specific session as per API requirement
        headers: {
          'Authorization': createBasicAuth(username, apiToken),
          'Accept': 'application/json'
          // Note: Content-Type is omitted since GET requests shouldn't have a body
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session metrics data:', data);
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
