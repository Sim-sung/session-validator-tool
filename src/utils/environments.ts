
// Helper functions for environment management

// Extract the API URL from the environment URL
export const getApiUrl = (environmentUrl: string): string => {
  // Remove trailing slash if it exists
  const normalizedUrl = environmentUrl.endsWith('/') 
    ? environmentUrl.slice(0, -1) 
    : environmentUrl;
  
  return normalizedUrl;
};

// Create Basic Auth header value for API authentication
export const createBasicAuth = (username: string, apiToken: string): string => {
  const credentials = `${username}:${apiToken}`;
  const encodedCredentials = btoa(credentials);
  return `Basic ${encodedCredentials}`;
};

// Environment options for the application
export const ENVIRONMENT_OPTIONS = [
  { label: 'Production', value: 'https://web.gamebench.net' },
  { label: 'QA', value: 'https://gb-v2-30-0.qa.gbdev.tech' }
];
