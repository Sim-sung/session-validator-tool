
import { useAuth } from "@/context/AuthContext";
import GameBenchApi from "@/services/gamebench-api";
import { useMemo } from "react";

export const useGameBenchApi = () => {
  const { apiToken, companyId, username } = useAuth();
  
  // Memoize the API instance to avoid recreating it on every render
  const api = useMemo(() => {
    return new GameBenchApi(apiToken, companyId, username);
  }, [apiToken, companyId, username]);
  
  return api;
};
