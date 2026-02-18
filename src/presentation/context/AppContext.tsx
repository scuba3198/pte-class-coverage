import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { buildDefaultState } from "../../domain/logic/normalization";
import type { AppState, ClassId, QuestionTypeId } from "../../domain/types";
import { LoadStateUseCase } from "../../application/use-cases/load-state";
import { SaveStateUseCase } from "../../application/use-cases/save-state";
import { ToggleCoverageUseCase } from "../../application/use-cases/toggle-coverage";
import {
  ManageSessionUseCase,
  type SessionAction,
} from "../../application/use-cases/manage-session";
import { ManageClassUseCase, type ClassAction } from "../../application/use-cases/manage-class";
import { ExportDataUseCase, ImportDataUseCase } from "../../application/use-cases/import-export";
import { createLogger } from "../../infrastructure/logger";
import { LocalStorageAdapter } from "../../infrastructure/storage/local-storage-adapter";
import type { Result } from "../../domain/result";

const STORAGE_KEY = "pte-tracker-state-v1";

interface AppContextValue {
  state: AppState;
  isLoading: boolean;
  actions: {
    toggleCoverage: (classId: ClassId, questionTypeId: QuestionTypeId) => Promise<void>;
    manageSession: (action: SessionAction) => Promise<void>;
    manageClass: (action: ClassAction) => Promise<void>;
    exportData: (filename: string) => Promise<void>;
    importData: (jsonData: string) => Promise<Result<void, any>>;
    refreshState: () => Promise<void>;
    toggleTheme: () => void;
  };
  theme: "light" | "dark";
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(buildDefaultState());
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("pte-tracker-theme");
      if (stored === "light" || stored === "dark") return stored;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
        return "dark";
      return "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pte-tracker-theme", theme);
  }, [theme]);

  // Injected dependencies
  const logger = useMemo(() => createLogger("App"), []);
  const storage = useMemo(() => new LocalStorageAdapter(logger), [logger]);

  const loadStateUseCase = useMemo(() => new LoadStateUseCase(logger, storage), [logger, storage]);
  const saveStateUseCase = useMemo(() => new SaveStateUseCase(logger, storage), [logger, storage]);
  const toggleCoverageUseCase = useMemo(() => new ToggleCoverageUseCase(logger), [logger]);
  const manageSessionUseCase = useMemo(() => new ManageSessionUseCase(logger), [logger]);
  const manageClassUseCase = useMemo(() => new ManageClassUseCase(logger), [logger]);
  const exportDataUseCase = useMemo(() => new ExportDataUseCase(logger), [logger]);
  const importDataUseCase = useMemo(() => new ImportDataUseCase(logger), [logger]);

  const generateCorrelationId = () => `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const refreshState = useCallback(async () => {
    const loadedState = await loadStateUseCase.execute(
      { storageKey: STORAGE_KEY },
      generateCorrelationId(),
    );
    setState(loadedState);
    setIsLoading(false);
  }, [loadStateUseCase]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Persist state changes
  useEffect(() => {
    if (isLoading) return;
    saveStateUseCase.execute({ storageKey: STORAGE_KEY, state }, generateCorrelationId());
  }, [state, isLoading, saveStateUseCase]);

  const wrappedActions = {
    toggleCoverage: async (classId: ClassId, questionTypeId: QuestionTypeId) => {
      const nextState = await toggleCoverageUseCase.execute(
        { state, classId, questionTypeId },
        generateCorrelationId(),
      );
      setState(nextState);
    },
    manageSession: async (action: SessionAction) => {
      const nextState = await manageSessionUseCase.execute(
        { state, action },
        generateCorrelationId(),
      );
      setState(nextState);
    },
    manageClass: async (action: ClassAction) => {
      const nextState = await manageClassUseCase.execute(
        { state, action },
        generateCorrelationId(),
      );
      setState(nextState);
    },
    exportData: async (filename: string) => {
      await exportDataUseCase.execute({ state, filename }, generateCorrelationId());
    },
    importData: async (jsonData: string): Promise<Result<void, any>> => {
      const result = await importDataUseCase.execute(
        { currentState: state, jsonData },
        generateCorrelationId(),
      );
      if (result.ok) {
        setState(result.value);
        return { ok: true, value: undefined };
      }
      return result;
    },
    toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    refreshState,
  };

  const value = useMemo(
    () => ({
      state,
      isLoading,
      theme,
      actions: wrappedActions,
    }),
    [state, isLoading, theme, wrappedActions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
