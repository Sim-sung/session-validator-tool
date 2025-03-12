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
    packageName?: string;
    versionCode?: number;
  };
  device: {
    model: string;
    manufacturer: string;
    batteryCapacity?: number;
    batteryVoltage?: number;
    screenWidth?: number;
    screenHeight?: number;
    refreshRate?: number;
    androidVersionRelease?: string;
    androidSdkInt?: number;
    cpu?: {
      name: string;
      arch: string;
      numCores: number;
      maxFreq: number;
      minFreq: number;
    };
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
  // Performance metrics
  fpsMin?: number;
  fpsMax?: number;
  fpsMedian?: number;
  fpsStability?: number;
  fpsOnePercentLow?: number;
  cpuUsageMin?: number;
  cpuUsageMax?: number;
  cpuUsageMedian?: number;
  cpuUsageAvg?: number;
  totalCpuUsageAvg?: number;
  gpuUsageMin?: number;
  gpuUsageMax?: number;
  gpuUsageMedian?: number;
  gpuUsageAvg?: number;
  memUsageMin?: number;
  memUsageMax?: number;
  memUsageMedian?: number;
  memUsageAvg?: number;
  androidMemUsageMin?: number;
  androidMemUsageMax?: number;
  androidMemUsageMedian?: number;
  androidMemUsageAvg?: number;
  firstBat?: number;
  lastBat?: number;
  powerUsage?: number;
  mWAvg?: number;
  mAh?: number;
  mAAvg?: number;
  
  // Janks metrics
  bigJanksCount?: number;
  bigJanks10Mins?: number;
  smallJanksCount?: number;
  smallJanks10Mins?: number;
  janksCount?: number;
  janks10Mins?: number;
  
  // App metrics
  appSize?: number;
  appCache?: number;
  appData?: number;
  appLaunchTimeMs?: number;
  totalDeviceMemory?: number;
  
  // Network metrics
  networkAppUsage?: {
    appTotalDataReceived: number;
    appTotalDataSent: number;
  };
  
  // Session info
  startTime?: number;
  duration?: number;
  userEmail: string;
  selected?: boolean;
  sessionDate?: number;
  timePlayed?: number;
  timePushed?: number;
  isActive?: boolean;
  isCharging?: boolean;
  
  // UI helper fields
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
  downloadSession: (sessionId: string) => Promise<void>;
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
            package: session.app?.packageName || session.app?.package || 'Unknown',
            packageName: session.app?.packageName,
            versionCode: session.app?.versionCode
          },
          device: {
            model: session.device?.model || 'Unknown',
            manufacturer: session.device?.manufacturer || 'Unknown',
            batteryCapacity: session.device?.batteryCapacity,
            batteryVoltage: session.device?.batteryVoltage,
            screenWidth: session.device?.screenWidth,
            screenHeight: session.device?.screenHeight,
            refreshRate: session.device?.refreshRate,
            androidVersionRelease: session.device?.androidVersionRelease,
            androidSdkInt: session.device?.androidSdkInt,
            cpu: session.device?.cpu
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
          selected: false,
          fpsMin: session.fpsMin,
          fpsMax: session.fpsMax,
          fpsMedian: session.fpsMedian,
          fpsStability: session.fpsStability,
          fpsOnePercentLow: session.fpsOnePercentLow,
          cpuUsageMin: session.cpuUsageMin,
          cpuUsageMax: session.cpuUsageMax,
          cpuUsageMedian: session.cpuUsageMedian,
          cpuUsageAvg: session.cpuUsageAvg,
          totalCpuUsageAvg: session.totalCpuUsageAvg,
          gpuUsageMin: session.gpuUsageMin,
          gpuUsageMax: session.gpuUsageMax,
          gpuUsageMedian: session.gpuUsageMedian,
          gpuUsageAvg: session.gpuUsageAvg,
          memUsageMin: session.memUsageMin,
          memUsageMax: session.memUsageMax,
          memUsageMedian: session.memUsageMedian,
          memUsageAvg: session.memUsageAvg,
          androidMemUsageMin: session.androidMemUsageMin,
          androidMemUsageMax: session.androidMemUsageMax,
          androidMemUsageMedian: session.androidMemUsageMedian,
          androidMemUsageAvg: session.androidMemUsageAvg,
          firstBat: session.firstBat,
          lastBat: session.lastBat,
          powerUsage: session.powerUsage,
          mWAvg: session.mWAvg,
          mAh: session.mAh,
          mAAvg: session.mAAvg,
          bigJanksCount: session.bigJanksCount,
          bigJanks10Mins: session.bigJanks10Mins,
          smallJanksCount: session.smallJanksCount,
          smallJanks10Mins: session.smallJanks10Mins,
          janksCount: session.janksCount,
          janks10Mins: session.janks10Mins,
          appSize: session.appSize,
          appCache: session.appCache,
          appData: session.appData,
          appLaunchTimeMs: session.appLaunchTimeMs,
          totalDeviceMemory: session.totalDeviceMemory,
          sessionDate: session.sessionDate,
          timePlayed: session.timePlayed,
          timePushed: session.timePushed,
          isActive: session.isActive,
          isCharging: session.isCharging
        }));
        
        setTotalSessions(data.totalHits || data.totalPages || mappedSessions.length);
      } else if (Array.isArray(data.sessions)) {
        console.log('Processing sessions array format with', data.sessions.length, 'items');
        mappedSessions = data.sessions.map((session: any) => ({
          id: session.id || 'unknown',
          app: {
            name: session.app?.name || 'Unknown',
            version: session.app?.version || 'Unknown',
            package: session.app?.package || 'Unknown',
            packageName: session.app?.packageName,
            versionCode: session.app?.versionCode
          },
          device: {
            model: session.device?.model || 'Unknown',
            manufacturer: session.device?.manufacturer || 'Unknown',
            batteryCapacity: session.device?.batteryCapacity,
            batteryVoltage: session.device?.batteryVoltage,
            screenWidth: session.device?.screenWidth,
            screenHeight: session.device?.screenHeight,
            refreshRate: session.device?.refreshRate,
            androidVersionRelease: session.device?.androidVersionRelease,
            androidSdkInt: session.device?.androidSdkInt,
            cpu: session.device?.cpu
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
          selected: false,
          fpsMin: session.metrics?.fps?.[0],
          fpsMax: session.metrics?.fps?.[1],
          fpsMedian: session.metrics?.fps?.[2],
          fpsStability: session.metrics?.fps?.[3],
          fpsOnePercentLow: session.metrics?.fps?.[4],
          cpuUsageMin: session.metrics?.cpu?.[0],
          cpuUsageMax: session.metrics?.cpu?.[1],
          cpuUsageMedian: session.metrics?.cpu?.[2],
          cpuUsageAvg: session.metrics?.cpu?.[3],
          totalCpuUsageAvg: session.metrics?.cpu?.[4],
          gpuUsageMin: session.metrics?.gpu?.[0],
          gpuUsageMax: session.metrics?.gpu?.[1],
          gpuUsageMedian: session.metrics?.gpu?.[2],
          gpuUsageAvg: session.metrics?.gpu?.[3],
          memUsageMin: session.metrics?.memory?.[0],
          memUsageMax: session.metrics?.memory?.[1],
          memUsageMedian: session.metrics?.memory?.[2],
          memUsageAvg: session.metrics?.memory?.[3],
          androidMemUsageMin: session.metrics?.memory?.[4],
          androidMemUsageMax: session.metrics?.memory?.[5],
          androidMemUsageMedian: session.metrics?.memory?.[6],
          androidMemUsageAvg: session.metrics?.memory?.[7],
          firstBat: session.metrics?.battery?.[0],
          lastBat: session.metrics?.battery?.[1],
          powerUsage: session.metrics?.battery?.[2],
          mWAvg: session.metrics?.battery?.[3],
          mAh: session.metrics?.battery?.[4],
          mAAvg: session.metrics?.battery?.[5],
          bigJanksCount: session.metrics?.battery?.[6],
          bigJanks10Mins: session.metrics?.battery?.[7],
          smallJanksCount: session.metrics?.battery?.[8],
          smallJanks10Mins: session.metrics?.battery?.[9],
          janksCount: session.metrics?.battery?.[10],
          janks10Mins: session.metrics?.battery?.[11],
          appSize: session.metrics?.battery?.[12],
          appCache: session.metrics?.battery?.[13],
          appData: session.metrics?.battery?.[14],
          appLaunchTimeMs: session.metrics?.battery?.[15],
          totalDeviceMemory: session.metrics?.battery?.[16],
          sessionDate: session.startTime,
          timePlayed: session.duration,
          timePushed: session.startTime,
          isActive: session.metrics?.battery?.[17],
          isCharging: session.metrics?.battery?.[18]
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
              package: session.app?.packageName || session.app?.package || 'Unknown',
              packageName: session.app?.packageName,
              versionCode: session.app?.versionCode
            },
            device: {
              model: session.device?.model || 'Unknown',
              manufacturer: session.device?.manufacturer || 'Unknown',
              batteryCapacity: session.device?.batteryCapacity,
              batteryVoltage: session.device?.batteryVoltage,
              screenWidth: session.device?.screenWidth,
              screenHeight: session.device?.screenHeight,
              refreshRate: session.device?.refreshRate,
              androidVersionRelease: session.device?.androidVersionRelease,
              androidSdkInt: session.device?.androidSdkInt,
              cpu: session.device?.cpu
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
            selected: false,
            fpsMin: session.fpsMin,
            fpsMax: session.fpsMax,
            fpsMedian: session.fpsMedian,
            fpsStability: session.fpsStability,
            fpsOnePercentLow: session.fpsOnePercentLow,
            cpuUsageMin: session.cpuUsageMin,
            cpuUsageMax: session.cpuUsageMax,
            cpuUsageMedian: session.cpuUsageMedian,
            cpuUsageAvg: session.cpuUsageAvg,
            totalCpuUsageAvg: session.totalCpuUsageAvg,
            gpuUsageMin: session.gpuUsageMin,
            gpuUsageMax: session.gpuUsageMax,
            gpuUsageMedian: session.gpuUsageMedian,
            gpuUsageAvg: session.gpuUsageAvg,
            memUsageMin: session.memUsageMin,
            memUsageMax: session.memUsageMax,
            memUsageMedian: session.memUsageMedian,
            memUsageAvg: session.memUsageAvg,
            androidMemUsageMin: session.androidMemUsageMin,
            androidMemUsageMax: session.androidMemUsageMax,
            androidMemUsageMedian: session.androidMemUsageMedian,
            androidMemUsageAvg: session.androidMemUsageAvg,
            firstBat: session.firstBat,
            lastBat: session.lastBat,
            powerUsage: session.powerUsage,
            mWAvg: session.mWAvg,
            mAh: session.mAh,
            mAAvg: session.mAAvg,
            bigJanksCount: session.bigJanksCount,
            bigJanks10Mins: session.bigJanks10Mins,
            smallJanksCount: session.smallJanksCount,
            smallJanks10Mins: session.smallJanks10Mins,
            janksCount: session.janksCount,
            janks10Mins: session.janks10Mins,
            appSize: session.appSize,
            appCache: session.appCache,
            appData: session.appData,
            appLaunchTimeMs: session.appLaunchTimeMs,
            totalDeviceMemory: session.totalDeviceMemory,
            sessionDate: session.sessionDate,
            timePlayed: session.timePlayed,
            timePushed: session.timePushed,
            isActive: session.isActive,
            isCharging: session.isCharging
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

  // Function to download a session
  const downloadSession = async (sessionId: string): Promise<void> => {
    if (!isAuthenticated || !apiToken || !username) {
      toast.error('Authentication required to download session');
      return;
    }

    try {
      const apiUrl = getApiUrl(environment);
      let url = `${apiUrl}/sessions/export/sessions/${sessionId}`;
      
      // Add company ID as a query parameter if available
      if (companyId) {
        url += `?company=${companyId}`;
      }
      
      console.log(`Downloading session with ID ${sessionId} from ${url}`);
      
      // Use fetch with GET method to download the file
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': createBasicAuth(username, apiToken),
          'Accept': 'application/zip, application/octet-stream'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `session-${sessionId}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.success('Session downloaded successfully');
    } catch (error) {
      console.error('Error downloading session:', error);
      toast.error('Failed to download session', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
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
        downloadSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
