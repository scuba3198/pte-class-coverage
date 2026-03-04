import React, { createContext, useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import { LocalStorageAdapter, type StorageAdapter, NotFoundError } from "../../infrastructure/storage/local-storage-adapter";
import { SupabaseStorageAdapter } from "../../infrastructure/storage/supabase-storage-adapter";
import { supabase } from "../../infrastructure/supabase";
import type { Result } from "../../domain/result";
import type { User } from "@supabase/supabase-js";

const STORAGE_KEY = "pte-tracker-state-v1";

interface AppContextValue {
  state: AppState;
  isLoading: boolean;
  user: User | null;
  isGuestMode: boolean;
  actions: {
    toggleCoverage: (classId: ClassId, questionTypeId: QuestionTypeId) => Promise<void>;
    manageSession: (action: SessionAction) => Promise<void>;
    manageClass: (action: ClassAction) => Promise<void>;
    exportData: (filename: string) => Promise<void>;
    importData: (jsonData: string) => Promise<Result<void, any>>;
    refreshState: () => Promise<void>;
    toggleTheme: () => void;
    logout: () => Promise<void>;
    setGuestMode: (isGuest: boolean) => void;
  };
  theme: "light" | "dark";
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(buildDefaultState());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
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

  const logger = useMemo(() => createLogger("App"), []);

  // Storage selection
  const storage = useMemo(() => {
    if (user) return new SupabaseStorageAdapter(logger);
    return new LocalStorageAdapter(logger);
  }, [logger, user]);

  // Track which storage instance has been successfully loaded
  const [initializedStorage, setInitializedStorage] = useState<StorageAdapter | null>(null);

  // Use a ref to capture the latest state for actions and effects
  const stateRef = useRef<AppState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const hasSyncedAfterLoginRef = useRef(false);
  const activeRefreshIdRef = useRef<string | null>(null);

  // Supabase Auth Listener
  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUser(session.user);
        setIsGuestMode(false);
      }
    });

    // Auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const newUser = session?.user ?? null;
      setUser((prev) => {
        if (prev?.id === newUser?.id && !!prev === !!newUser) return prev;
        return newUser;
      });
      if (newUser) {
        setIsGuestMode(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pte-tracker-theme", theme);
  }, [theme]);

  // UseCases
  const loadStateUseCase = useMemo(() => new LoadStateUseCase(logger, storage), [logger, storage]);
  const saveStateUseCase = useMemo(() => new SaveStateUseCase(logger, storage), [logger, storage]);
  const toggleCoverageUseCase = useMemo(() => new ToggleCoverageUseCase(logger), [logger]);
  const manageSessionUseCase = useMemo(() => new ManageSessionUseCase(logger), [logger]);
  const manageClassUseCase = useMemo(() => new ManageClassUseCase(logger), [logger]);
  const exportDataUseCase = useMemo(() => new ExportDataUseCase(logger), [logger]);
  const importDataUseCase = useMemo(() => new ImportDataUseCase(logger), [logger]);

  const generateCorrelationId = () => `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const refreshState = useCallback(async (isInitialLogin = false) => {
    const correlationId = generateCorrelationId();
    activeRefreshIdRef.current = correlationId;

    setIsLoading(true);
    setInitializedStorage(null);

    const currentMemoryState = stateRef.current;
    const currentStorage = storage;

    logger.info("Refreshing state", { isInitialLogin, storage: user ? "supabase" : "local", correlationId });

    try {
      const result = await loadStateUseCase.execute(
        { storageKey: STORAGE_KEY },
        correlationId,
      );

      // Verify this is still the active (latest) refresh request
      if (activeRefreshIdRef.current !== correlationId) {
        logger.info("Refresh preempted by newer request, discarding", { correlationId });
        return;
      }

      // Verify storage hasn't changed out from under us
      if (storage !== currentStorage) {
        logger.warn("Storage changed during load, discarding results", { correlationId });
        return;
      }

      let loadedState: AppState;

      if (result.ok) {
        loadedState = result.value;
      } else if (result.error instanceof NotFoundError) {
        logger.info("No state found in storage, using default", { correlationId });
        loadedState = buildDefaultState();
      } else {
        logger.error("State load failed with a serious error. Aborting initialization to protect cloud data.", {
          error: result.error.message,
          correlationId
        });
        setIsLoading(false);
        return;
      }

      if (isInitialLogin && user) {
        const cloudHasData = Object.values(loadedState.coverage).some(c => Object.values(c).some(v => v === true)) ||
          Object.values(loadedState.sessions).some(s => s.length > 0);

        const memoryHasData = Object.values(currentMemoryState.coverage).some(c => Object.values(c).some(v => v === true)) ||
          Object.values(currentMemoryState.sessions).some(s => s.length > 0);

        if (!cloudHasData && memoryHasData) {
          logger.info("Merging local work into fresh cloud profile", { correlationId });
          setState(currentMemoryState);
          setInitializedStorage(currentStorage);
          setIsLoading(false);
          return;
        }
      }

      setState(loadedState);
      setInitializedStorage(currentStorage);
    } catch (err) {
      logger.error("Unexpected error during refreshState", { error: err, correlationId });
    } finally {
      // Only reset loading state if we are still the relevant request
      if (activeRefreshIdRef.current === correlationId) {
        setIsLoading(false);
      }
    }
  }, [loadStateUseCase, user, storage, logger]);

  // Handle storage transitions (refresh when user/storage changes)
  // Debounced to prevent rapid-fire triggers from multiple auth events
  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoginTransition = !!user && !hasSyncedAfterLoginRef.current;
      if (user) hasSyncedAfterLoginRef.current = true;
      else hasSyncedAfterLoginRef.current = false;

      refreshState(isLoginTransition);
    }, 100);

    return () => clearTimeout(timer);
  }, [user, storage, refreshState]);

  // Auto-save effect
  useEffect(() => {
    if (isLoading || initializedStorage !== storage) {
      return;
    }

    const correlationId = generateCorrelationId();
    saveStateUseCase.execute({ storageKey: STORAGE_KEY, state }, correlationId);
  }, [state, initializedStorage, storage, isLoading, saveStateUseCase]);

  const wrappedActions = useMemo(() => ({
    toggleCoverage: async (classId: ClassId, questionTypeId: QuestionTypeId) => {
      const nextState = await toggleCoverageUseCase.execute({ state: stateRef.current, classId, questionTypeId }, generateCorrelationId());
      setState(nextState);
    },
    manageSession: async (action: SessionAction) => {
      const nextState = await manageSessionUseCase.execute({ state: stateRef.current, action }, generateCorrelationId());
      setState(nextState);
    },
    manageClass: async (action: ClassAction) => {
      const nextState = await manageClassUseCase.execute({ state: stateRef.current, action }, generateCorrelationId());
      setState(nextState);
    },
    exportData: async (filename: string) => {
      await exportDataUseCase.execute({ state: stateRef.current, filename }, generateCorrelationId());
    },
    importData: async (jsonData: string): Promise<Result<void, any>> => {
      const result = await importDataUseCase.execute({ currentState: stateRef.current, jsonData }, generateCorrelationId());
      if (result.ok) { setState(result.value); return { ok: true, value: undefined }; }
      return result;
    },
    toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    refreshState: () => refreshState(false),
    logout: async () => {
      setIsLoading(true);
      setInitializedStorage(null);
      activeRefreshIdRef.current = "logout"; // Block any pending refreshes
      try {
        await supabase.auth.signOut();
        setState(buildDefaultState());
        hasSyncedAfterLoginRef.current = false;
        setIsGuestMode(false);
      } finally {
        setIsLoading(false);
      }
    },
    setGuestMode: (isGuest: boolean) => {
      setIsGuestMode(isGuest);
      if (isGuest) {
        refreshState(false);
      }
    }
  }), [refreshState, toggleCoverageUseCase, manageSessionUseCase, manageClassUseCase, exportDataUseCase, importDataUseCase, logger]);

  const value = useMemo(() => ({
    state,
    isLoading,
    user,
    isGuestMode,
    theme,
    actions: wrappedActions,
  }), [state, isLoading, user, isGuestMode, theme, wrappedActions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
