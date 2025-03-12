
import React, { createContext, useContext, useState } from 'react';
import { toast } from "@/components/ui/sonner";

// Type definitions
export interface Session {
  id: string;
  appName: string;
  appVersion: string;
  deviceModel: string;
  manufacturer: string;
  recordedBy: string;
  startTime: string;
  duration: number;
  selected?: boolean;
}

export interface SessionMetrics {
  sessionId: string;
  appDetails: {
    name: string;
    version: string;
    package: string;
  };
  deviceDetails: {
    manufacturer: string;
    model: string;
    gpuType: string;
  };
  userDetails: {
    email: string;
    username: string;
  };
  timestamp: string;
  duration: number;
  fps?: number[];
  cpu?: number[];
  gpu?: number[];
  memory?: number[];
  battery?: number[];
  network?: {
    upload: number[];
    download: number[];
  };
}

interface DateRange {
  from: Date;
  to: Date;
}

interface SessionContextType {
  sessions: Session[];
  selectedSessions: Session[];
  sessionMetrics: SessionMetrics[];
  isLoading: boolean;
  dateRange: DateRange;
  searchQuery: string;
  setDateRange: (range: DateRange) => void;
  setSearchQuery: (query: string) => void;
  fetchSessions: () => Promise<void>;
  toggleSession: (sessionId: string, selected: boolean) => void;
  toggleAllSessions: (selected: boolean) => void;
  deleteSelectedSessions: () => Promise<void>;
  downloadSelectedSessions: () => Promise<void>;
  fetchSessionMetrics: (sessionId: string) => Promise<SessionMetrics | null>;
  saveSessionMetricsForValidation: (metrics: SessionMetrics) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Mock data generator
const generateMockSessions = (count: number): Session[] => {
  const apps = ['GameBench Pro', 'Fortnite', 'PUBG Mobile', 'Call of Duty', 'Minecraft'];
  const devices = ['iPhone 13 Pro', 'Samsung Galaxy S21', 'Google Pixel 6', 'iPad Pro', 'OnePlus 9'];
  const manufacturers = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus'];
  const users = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `session-${Date.now()}-${i}`,
    appName: apps[Math.floor(Math.random() * apps.length)],
    appVersion: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    deviceModel: devices[Math.floor(Math.random() * devices.length)],
    manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
    recordedBy: users[Math.floor(Math.random() * users.length)],
    startTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    duration: Math.floor(Math.random() * 3600), // duration in seconds
    selected: false,
  }));
};

// Mock metrics generator
const generateMockMetrics = (sessionId: string): SessionMetrics => {
  return {
    sessionId,
    appDetails: {
      name: 'GameBench Pro',
      version: '4.2.1',
      package: 'com.gamebench.pro',
    },
    deviceDetails: {
      manufacturer: 'Apple',
      model: 'iPhone 13 Pro',
      gpuType: 'Apple GPU',
    },
    userDetails: {
      email: 'user@example.com',
      username: 'testuser',
    },
    timestamp: new Date().toISOString(),
    duration: 1800, // 30 minutes
    fps: Array.from({ length: 30 }, () => Math.floor(30 + Math.random() * 30)),
    cpu: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
    gpu: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
    memory: Array.from({ length: 30 }, () => Math.floor(100 + Math.random() * 900)),
    battery: Array.from({ length: 30 }, () => 100 - Math.floor(Math.random() * 20)),
    network: {
      upload: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000)),
      download: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10000)),
    },
  };
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSessions = sessions.filter(session => session.selected);

  const fetchSessions = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, this would be a fetch call to the GameBench API
      const mockSessions = generateMockSessions(25);
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSession = (sessionId: string, selected: boolean): void => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, selected } : session
      )
    );
  };

  const toggleAllSessions = (selected: boolean): void => {
    setSessions(prevSessions =>
      prevSessions.map(session => ({ ...session, selected }))
    );
  };

  const deleteSelectedSessions = async (): Promise<void> => {
    if (selectedSessions.length === 0) {
      toast.warning('No sessions selected');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove selected sessions from state
      setSessions(prevSessions =>
        prevSessions.filter(session => !session.selected)
      );
      
      toast.success(`${selectedSessions.length} sessions deleted successfully`);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      toast.error('Failed to delete sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSelectedSessions = async (): Promise<void> => {
    if (selectedSessions.length === 0) {
      toast.warning('No sessions selected');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, this would trigger downloads
      toast.success(`Downloading ${selectedSessions.length} sessions`);
    } catch (error) {
      console.error('Error downloading sessions:', error);
      toast.error('Failed to download sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionMetrics = async (sessionId: string): Promise<SessionMetrics | null> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock metrics
      const metrics = generateMockMetrics(sessionId);
      return metrics;
    } catch (error) {
      console.error('Error fetching session metrics:', error);
      toast.error('Failed to fetch session metrics');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessionMetricsForValidation = (metrics: SessionMetrics): void => {
    // Check if metrics already exists and update or add
    setSessionMetrics(prevMetrics => {
      const index = prevMetrics.findIndex(m => m.sessionId === metrics.sessionId);
      if (index >= 0) {
        // Update existing metrics
        const updatedMetrics = [...prevMetrics];
        updatedMetrics[index] = metrics;
        return updatedMetrics;
      } else {
        // Add new metrics
        return [...prevMetrics, metrics];
      }
    });
    
    toast.success('Session metrics saved for validation');
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        selectedSessions,
        sessionMetrics,
        isLoading,
        dateRange,
        searchQuery,
        setDateRange,
        setSearchQuery,
        fetchSessions,
        toggleSession,
        toggleAllSessions,
        deleteSelectedSessions,
        downloadSelectedSessions,
        fetchSessionMetrics,
        saveSessionMetricsForValidation,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
