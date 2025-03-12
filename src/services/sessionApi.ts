
import { Session } from '@/types/validation';

// Mock data for sessions
const mockSessions: Session[] = [
  {
    id: '1',
    uuid: 'uuid-1',
    appName: 'Demo Game',
    deviceModel: 'Pixel 6',
    manufacturer: 'Google',
    appVersion: '1.0.0',
    startTime: Date.now() - 864000000, // 10 days ago
    duration: 3600,
    selected: false,
    recordedBy: 'user@example.com'
  },
  {
    id: '2',
    uuid: 'uuid-2',
    appName: 'Racing Game',
    deviceModel: 'Galaxy S21',
    manufacturer: 'Samsung',
    appVersion: '2.1.0',
    startTime: Date.now() - 432000000, // 5 days ago
    duration: 7200,
    selected: false,
    recordedBy: 'user@example.com'
  },
  {
    id: '3',
    uuid: 'uuid-3',
    appName: 'Adventure Game',
    deviceModel: 'iPhone 13',
    manufacturer: 'Apple',
    appVersion: '3.0.2',
    startTime: Date.now() - 86400000, // 1 day ago
    duration: 5400,
    selected: false,
    recordedBy: 'user@example.com'
  }
];

// Mock API function to fetch sessions
export const fetchSessions = async (params: any = {}) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter sessions based on search params
  let filteredSessions = [...mockSessions];
  
  if (params.searchQuery) {
    const query = params.searchQuery.toLowerCase();
    filteredSessions = filteredSessions.filter(session => 
      session.appName.toLowerCase().includes(query) ||
      session.deviceModel.toLowerCase().includes(query) ||
      session.manufacturer.toLowerCase().includes(query)
    );
  }
  
  if (params.dateStart) {
    filteredSessions = filteredSessions.filter(session => 
      session.startTime >= params.dateStart
    );
  }
  
  if (params.dateEnd) {
    filteredSessions = filteredSessions.filter(session => 
      session.startTime <= params.dateEnd
    );
  }
  
  // Paginate results
  const pageSize = params.pageSize || 10;
  const page = params.page || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + pageSize);
  
  return {
    sessions: paginatedSessions,
    total: filteredSessions.length
  };
};

// Mock API function to download a session
export const downloadSession = async (sessionId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would initiate a file download
  console.log(`Downloading session with ID: ${sessionId}`);
  
  return true;
};

// Mock API function to delete a session
export const deleteSession = async (sessionId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`Deleting session with ID: ${sessionId}`);
  
  return true;
};
