
/**
 * GameBench API Service
 * 
 * This service provides methods to interact with the GameBench API.
 * It handles all API calls and returns the responses in a consistent format.
 */

const BASE_URL = 'https://web.gamebench.net';

// Types for API responses
export interface SessionSearchResponse {
  content: Session[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

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
  metrics: {
    fps: {
      avg: number;
      stability: number;
    };
    cpu: {
      avg: number;
    };
    memory: {
      avg: number;
    };
    battery: {
      drain: number;
    };
  };
  startTime: number;
  duration: number;
  userEmail: string;
}

export interface TypeaheadResponse {
  key: string;
  doc_count: number;
  type: 'app' | 'device' | 'manufacturer';
}

export interface TimeSeriesData {
  data: {
    timestamp: number;
    value: number;
  }[];
}

export type MetricType = 
  | 'battery' 
  | 'corefreq' 
  | 'cpu' 
  | 'energy' 
  | 'fps' 
  | 'fpsStability' 
  | 'gpu/img' 
  | 'gpu/other' 
  | 'janks' 
  | 'markers' 
  | 'memory' 
  | 'android-memory' 
  | 'network' 
  | 'notes' 
  | 'power'
  | 'frametimes';

// Create the auth header for API requests
const createAuthHeader = (apiToken: string, username: string = '') => {
  const auth = username ? `${username}:${apiToken}` : `:${apiToken}`;
  return `Basic ${btoa(auth)}`;
};

// API client class
class GameBenchApi {
  private apiToken: string;
  private username: string;
  private companyId: string;

  constructor(apiToken: string, companyId: string = '', username: string = '') {
    this.apiToken = apiToken;
    this.companyId = companyId;
    this.username = username;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': createAuthHeader(this.apiToken, this.username),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    return await response.json() as T;
  }

  // Validate API credentials
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to get a single session to validate credentials
      const url = `${BASE_URL}/v1/sessions?pageSize=1`;
      await this.request(url, { method: 'POST', body: JSON.stringify({ apps: [], devices: [], manufacturers: [] }) });
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }

  // Search for sessions
  async searchSessions(options: {
    pageSize?: number;
    page?: number;
    sort?: string;
    apps?: string[];
    devices?: string[];
    manufacturers?: string[];
    dateStart?: number;
    dateEnd?: number;
    durationStart?: number;
    durationEnd?: number;
    notes?: string;
    userEmails?: string[];
  } = {}): Promise<SessionSearchResponse> {
    const {
      pageSize = 15,
      page = 0,
      sort = 'timePushed:desc',
      apps = [],
      devices = [],
      manufacturers = [],
      dateStart,
      dateEnd,
      durationStart,
      durationEnd,
      notes,
      userEmails = [],
    } = options;

    // Determine if we're using the advanced search or simple search
    const isAdvancedSearch = dateStart || dateEnd || durationStart || durationEnd || notes || userEmails.length > 0;
    
    let url = isAdvancedSearch
      ? `${BASE_URL}/v1/advanced-search/sessions?`
      : `${BASE_URL}/v1/sessions?`;
    
    // Add company ID if provided
    if (this.companyId) {
      url += `company=${this.companyId}&`;
    }
    
    // Add pagination and sorting
    url += `pageSize=${pageSize}&page=${page}&sort=${encodeURIComponent(sort)}`;
    
    // Prepare request body based on search type
    let body: any;
    
    if (isAdvancedSearch) {
      body = {
        sessionInfo: {
          dateStart,
          dateEnd,
          durationStart,
          durationEnd,
          notes,
          userEmail: userEmails,
        },
        appInfo: {
          name: apps,
        },
        deviceInfo: {
          model: devices,
          manufacturer: manufacturers,
        },
      };
    } else {
      body = {
        apps,
        devices,
        manufacturers,
      };
    }
    
    return this.request<SessionSearchResponse>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Search for keywords (typeahead)
  async searchKeywords(query: string[]): Promise<TypeaheadResponse[]> {
    const url = `${BASE_URL}/v1/sessions/typeahead`;
    return this.request<TypeaheadResponse[]>(url, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Get session details
  async getSessionDetails(sessionId: string): Promise<any> {
    const url = `${BASE_URL}/v1/sessions/${sessionId}`;
    return this.request(url);
  }

  // Get session metric data
  async getSessionMetric(sessionId: string, metricType: MetricType): Promise<any> {
    const url = `${BASE_URL}/v1/sessions/${sessionId}/${metricType}`;
    return this.request(url);
  }

  // Get all metrics for a session (for validation)
  async getAllSessionMetrics(sessionId: string): Promise<Record<MetricType, any>> {
    const metricsToFetch: MetricType[] = [
      'battery', 'corefreq', 'cpu', 'energy', 'fps', 'fpsStability',
      'janks', 'markers', 'memory', 'network', 'notes', 'power'
    ];
    
    // Try to get GPU metrics - we don't know which type this device has,
    // so try both and use whichever succeeds
    try {
      await this.getSessionMetric(sessionId, 'gpu/img');
      metricsToFetch.push('gpu/img');
    } catch {
      try {
        await this.getSessionMetric(sessionId, 'gpu/other');
        metricsToFetch.push('gpu/other');
      } catch {
        // No GPU data available
      }
    }
    
    // Try to get Android memory if available
    try {
      await this.getSessionMetric(sessionId, 'android-memory');
      metricsToFetch.push('android-memory');
    } catch {
      // Not an Android device or older version
    }
    
    // Fetch all metrics in parallel
    const results = await Promise.allSettled(
      metricsToFetch.map(async (metricType) => ({
        metricType,
        data: await this.getSessionMetric(sessionId, metricType),
      }))
    );
    
    // Compile results
    const allMetrics: Partial<Record<MetricType, any>> = {};
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allMetrics[result.value.metricType] = result.value.data;
      }
    });
    
    return allMetrics as Record<MetricType, any>;
  }
}

export default GameBenchApi;
