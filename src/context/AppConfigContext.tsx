import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAppConfig } from "@/services/app-config.service";
import type { AppConfig } from "@/services/app-config.service";

interface AppConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAppConfig();
      setConfig(data);
    } catch (err: any) {
      console.error("Error loading app config:", err);
      setError(err.message || "Error loading configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  return (
    <AppConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within an AppConfigProvider");
  }
  return context;
};
