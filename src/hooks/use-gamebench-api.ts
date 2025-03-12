
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import GameBenchApi, { MetricType, Session, TypeaheadResponse } from '@/services/api';

export function useGameBenchApi() {
  const { apiToken, companyId, username } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = new GameBenchApi(apiToken, companyId, username);

  const searchSessions = async (options: {
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
  } = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await api.searchSessions(options);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchKeywords = async (query: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await api.searchKeywords(query);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionDetails = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await api.getSessionDetails(sessionId);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionMetric = async (sessionId: string, metricType: MetricType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await api.getSessionMetric(sessionId, metricType);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllSessionMetrics = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await api.getAllSessionMetrics(sessionId);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchSessions,
    searchKeywords,
    getSessionDetails,
    getSessionMetric,
    getAllSessionMetrics,
    isLoading,
    error,
  };
}
