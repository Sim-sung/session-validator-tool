
import GameBenchApi from './api';

// Create a singleton instance of the API client
let apiClient: GameBenchApi | null = null;

export const initializeApiClient = (apiToken: string, companyId: string = '', username: string = '') => {
  apiClient = new GameBenchApi(apiToken, companyId, username);
  return apiClient;
};

export const getApiClient = () => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient first.');
  }
  return apiClient;
};

export const getSessions = async (params: any = {}) => {
  const client = getApiClient();
  const response = await client.searchSessions(params);
  
  // Transform the API response to match our Session type
  const sessions = response.content.map(session => ({
    id: session.id,
    uuid: session.id,
    appName: session.app.name,
    appVersion: session.app.version,
    deviceModel: session.device.model,
    manufacturer: session.device.manufacturer,
    recordedBy: session.userEmail,
    startTime: session.startTime,
    duration: session.duration,
    selected: false,
    // Add other fields as necessary
  }));
  
  return {
    sessions,
    total: response.totalElements
  };
};

export const downloadSession = async (sessionId: string) => {
  const client = getApiClient();
  // This is a placeholder - implement the actual download logic
  // Most likely you would get the session details and trigger a file download
  const sessionDetails = await client.getSessionDetails(sessionId);
  
  // Create a download link for the session data
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionDetails));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `session-${sessionId}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const deleteSession = async (sessionId: string) => {
  // This would be implemented based on your API's delete session endpoint
  // For now, just log the deletion attempt
  console.log(`Deleting session ${sessionId}`);
  // In a real implementation, you would call:
  // const client = getApiClient();
  // await client.deleteSession(sessionId);
  return true;
};

export const fetchSessionMetrics = async (sessionId: string) => {
  const client = getApiClient();
  const sessionDetails = await client.getSessionDetails(sessionId);
  const metrics = await client.getAllSessionMetrics(sessionId);
  
  // Transform the data into a SessionMetrics object
  return {
    appDetails: {
      name: sessionDetails.app.name,
      version: sessionDetails.app.version,
      package: sessionDetails.app.package
    },
    deviceDetails: {
      model: sessionDetails.device.model,
      manufacturer: sessionDetails.device.manufacturer,
      gpuType: sessionDetails.device.gpu?.renderer || 'Unknown'
    },
    userDetails: {
      email: sessionDetails.userEmail,
      username: sessionDetails.userEmail.split('@')[0]
    },
    timestamp: sessionDetails.startTime,
    duration: sessionDetails.duration,
    fps: metrics.fps?.data.map(point => point.value) || [],
    cpu: metrics.cpu?.data.map(point => point.value) || [],
    gpu: (metrics['gpu/img'] || metrics['gpu/other'])?.data.map(point => point.value) || [],
    battery: metrics.battery?.data.map(point => point.value) || [],
    // Add other metrics as needed
  };
};

export const saveSessionMetricsForValidation = (metrics: any) => {
  // This would save the metrics for validation
  // For now, just log that we're saving
  console.log('Saving metrics for validation', metrics);
  localStorage.setItem('sessionMetricsForValidation', JSON.stringify(metrics));
  return true;
};
