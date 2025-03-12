
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchSessions, downloadSession as downloadSessionApi, deleteSession as deleteSessionApi } from '@/services/sessionApi';
import { Session, SessionMetrics } from '@/types/validation';

// Context type
interface SessionContextType {
  sessions: Session[];
  isLoading: boolean;
  totalSessions: number;
  currentPage: number;
  selectedSessions: Session[];
  searchParams: {
    dateStart?: number;
    dateEnd?: number;
    apps?: string[];
    devices?: string[];
    manufacturers?: string[];
    page: number;
    pageSize: number;
    sort?: string;
    searchQuery?: string;
  };
  fetchSessions: (params?: any) => Promise<void>;
  selectSession: (sessionId: string, checked: boolean) => void;
  selectAllSessions: (checked: boolean) => void;
  setSearchParams: (params: any) => void;
  resetSearchParams: () => void;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  downloadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  fetchSessionMetrics: (sessionId: string) => Promise<SessionMetrics>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [searchParams, setSearchParams] = useState({
    dateStart: undefined,
    dateEnd: undefined,
    apps: [],
    devices: [],
    manufacturers: [],
    page: 1,
    pageSize: 10,
    sort: undefined,
    searchQuery: undefined
  });

  const fetchSessionsData = async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await fetchSessions(params);
      setSessions(response.sessions);
      setTotalSessions(response.total);
      setCurrentPage(params.page || 1);
      
      // Update selected sessions based on the new data
      setSelectedSessions(prevSelected => {
        return prevSelected.filter(selectedSession => 
          response.sessions.some(session => session.id === selectedSession.id)
        );
      });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (sessionId: string, checked: boolean) => {
    setSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            selected: checked
          };
        }
        return session;
      });
    });

    setSelectedSessions(prevSelected => {
      if (checked) {
        const sessionToAdd = sessions.find(session => session.id === sessionId);
        return sessionToAdd ? [...prevSelected, sessionToAdd] : prevSelected;
      } else {
        return prevSelected.filter(session => session.id !== sessionId);
      }
    });
  };

  const selectAllSessions = (checked: boolean) => {
    setSessions(prevSessions => {
      return prevSessions.map(session => ({
        ...session,
        selected: checked
      }));
    });
    
    setSelectedSessions(checked ? [...sessions] : []);
  };

  const updateSearchParams = (params: any) => {
    setSearchParams(prevParams => ({
      ...prevParams,
      ...params,
      page: 1
    }));
  };

  const resetSearchParams = () => {
    setSearchParams({
      dateStart: undefined,
      dateEnd: undefined,
      apps: [],
      devices: [],
      manufacturers: [],
      page: 1,
      pageSize: 10,
      sort: undefined,
      searchQuery: undefined
    });
  };

  const downloadSession = async (sessionId: string) => {
    try {
      await downloadSessionApi(sessionId);
    } catch (error) {
      console.error("Failed to download session:", error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await deleteSessionApi(sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  };

  // Mock implementation for fetchSessionMetrics
  const fetchSessionMetrics = async (sessionId: string): Promise<SessionMetrics> => {
    // In a real application, this would make an API call
    // For now, return mock data
    return {
      fps: [60, 58, 59, 60, 57, 60, 59, 60, 60, 58],
      cpu: [25, 30, 28, 32, 35, 30, 27, 29, 31, 28],
      gpu: [40, 45, 42, 47, 50, 48, 45, 46, 47, 44],
      battery: [95, 94, 93, 92, 91, 90, 89, 88, 87, 86],
      appDetails: {
        name: "Demo App",
        version: "1.0.0",
        package: "com.example.demoapp"
      },
      deviceDetails: {
        model: "Test Model",
        manufacturer: "Test Manufacturer",
        gpuType: "Test GPU"
      },
      userDetails: {
        email: "user@example.com",
        username: "testuser"
      }
    };
  };

  useEffect(() => {
    fetchSessionsData(searchParams);
  }, [searchParams]);

  const value = {
    sessions,
    isLoading,
    totalSessions,
    currentPage,
    selectedSessions,
    searchParams,
    fetchSessions: fetchSessionsData,
    selectSession,
    selectAllSessions,
    setSearchParams: updateSearchParams,
    resetSearchParams,
    setSessions,
    downloadSession,
    deleteSession,
    fetchSessionMetrics
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
