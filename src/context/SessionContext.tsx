
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useContext,
  ReactNode
} from 'react';
import { 
  getSessions as fetchAllSessions,
  downloadSession as downloadSessionApi,
  deleteSession as deleteSessionApi
} from '@/services/api';
import { Session } from '@/types/validation';

interface SearchParams {
  dateStart?: number;
  dateEnd?: number;
  apps?: string[];
  devices?: string[];
  manufacturers?: string[];
  page?: number;
  pageSize?: number;
  sort?: string;
  searchQuery?: string;
}

export interface SessionContextType {
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
    page?: number;
    pageSize?: number;
    sort?: string;
    searchQuery?: string;
  };
  fetchSessions: (params?: Partial<SearchParams>) => Promise<void>;
  selectSession: (sessionId: string, checked: boolean) => void;
  selectAllSessions: (checked: boolean) => void;
  setSearchParams: (params: Partial<SearchParams>) => void;
  resetSearchParams: () => void;
  setSessions: (sessions: Session[]) => void;
  downloadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    dateStart: undefined,
    dateEnd: undefined,
    apps: [],
    devices: [],
    manufacturers: [],
    page: 1,
    pageSize: 10,
    sort: undefined,
    searchQuery: undefined,
  });

  const fetchSessions = async (params: Partial<SearchParams> = {}) => {
    setIsLoading(true);
    try {
      const response = await fetchAllSessions(params);
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
          return { ...session, selected: checked };
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
      return prevSessions.map(session => ({ ...session, selected: checked }));
    });
    setSelectedSessions(checked ? [...sessions] : []);
  };

  const updateSearchParams = (params: Partial<SearchParams>) => {
    setSearchParams(prevParams => ({ ...prevParams, ...params, page: 1 }));
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
      searchQuery: undefined,
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

  useEffect(() => {
    fetchSessions(searchParams);
  }, [searchParams]);

  const value: SessionContextType = {
    sessions,
    isLoading,
    totalSessions,
    currentPage,
    selectedSessions,
    searchParams,
    fetchSessions,
    selectSession,
    selectAllSessions,
    setSearchParams: updateSearchParams,
    resetSearchParams,
    setSessions,
    downloadSession,
    deleteSession,
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

