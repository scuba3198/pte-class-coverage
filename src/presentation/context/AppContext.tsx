import React, { createContext, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { buildDefaultState } from "../../domain/logic/normalization";
import type { AppState, ClassId, QuestionTypeId } from "../../domain/types";
import { loadState } from "../../application/use-cases/load-state";
import { saveState } from "../../application/use-cases/save-state";
import { toggleCoverage } from "../../application/use-cases/toggle-coverage";
import { manageSession, type SessionAction } from "../../application/use-cases/manage-session";
import { manageClass, type ClassAction } from "../../application/use-cases/manage-class";
import { exportData, importData } from "../../application/use-cases/import-export";
import { createLogger } from "../../infrastructure/logger";
import { localStorageService } from "../../infrastructure/storage/local-storage-adapter";
import { supabaseStorageService } from "../../infrastructure/storage/supabase-storage-adapter";
import { NotFoundError, type StorageService } from "../../infrastructure/storage/storage-service";
import { supabase } from "../../infrastructure/supabase";
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
    importData: (
      jsonData: string,
    ) => Promise<{ ok: true; value: undefined } | { ok: false; error: Error }>;
    refreshState: () => Promise<void>;
    toggleTheme: () => void;
    logout: () => Promise<void>;
    setGuestMode: (isGuest: boolean) => void;
  };
  theme: "light" | "dark";
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => buildDefaultState());
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
  const storage = useMemo<StorageService>(() => {
    if (user) return supabaseStorageService;
    return localStorageService;
  }, [user]);

  // Track which storage type has been successfully loaded
  const [initializedStorage, setInitializedStorage] = useState<"supabase" | "local" | null>(null);

  // Use a ref to capture the latest state for actions and effects
  const stateRef = useRef<AppState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const activeRefreshIdRef = useRef<string | null>(null);

  // Supabase Auth Listener
  useEffect(() => {
    let mounted = true;

    // Initial session check
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted && session?.user) {
          setUser(session.user);
          setIsGuestMode(false);
        }
      });
    }

    // Auth events
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pte-tracker-theme", theme);
  }, [theme]);

  const generateCorrelationId = () => `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const refreshState = useCallback(
    async (isInitialLogin = false) => {
      const correlationId = generateCorrelationId();
      activeRefreshIdRef.current = correlationId;

      setIsLoading(true);
      setInitializedStorage(null);

      logger.info("Refreshing state", {
        isInitialLogin,
        storage: user ? "supabase" : "local",
        correlationId,
      });

      try {
        const currentStorageType = user ? "supabase" : "local";

        try {
          const loadedState = await loadState(storage, { storageKey: STORAGE_KEY });
          if (activeRefreshIdRef.current !== correlationId) {
            logger.info("Refresh preempted by newer request, discarding", { correlationId });
            return;
          }
          setState(loadedState);
          setInitializedStorage(currentStorageType);
        } catch (error) {
          if (activeRefreshIdRef.current !== correlationId) {
            logger.info("Refresh preempted by newer request, discarding", { correlationId });
            return;
          }
          if (error instanceof NotFoundError) {
            logger.info("No state found in storage, using default", { correlationId });
            setState(buildDefaultState());
            setInitializedStorage(currentStorageType);
          } else {
            const errorMsg = error instanceof Error ? error.message : "Unexpected error";
            logger.error(
              "State load failed with a serious error. Aborting initialization to protect cloud data.",
              {
                error: errorMsg,
                correlationId,
              },
            );
          }
        }
      } catch (err) {
        logger.error("Unexpected error during refreshState", { error: err, correlationId });
      } finally {
        // Only reset loading state if we are still the relevant request
        if (activeRefreshIdRef.current === correlationId) {
          setIsLoading(false);
        }
      }
    },
    [storage, user, logger],
  );

  // Handle storage transitions (refresh when user/storage changes)
  // Debounced to prevent rapid-fire triggers from multiple auth events
  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoginTransition = !!user;
      refreshState(isLoginTransition);
    }, 100);

    return () => clearTimeout(timer);
  }, [user, refreshState]);

  // Auto-save effect
  useEffect(() => {
    const currentStorageType = user ? "supabase" : "local";
    if (isLoading || initializedStorage !== currentStorageType) {
      return;
    }

    void saveState(storage, { storageKey: STORAGE_KEY, state }).catch((error) =>
      logger.error("State save failed", { error }),
    );
  }, [state, initializedStorage, user, isLoading, storage, logger]);

  const wrappedActions = useMemo(
    () => ({
      toggleCoverage: async (classId: ClassId, questionTypeId: QuestionTypeId) => {
        setState(toggleCoverage({
          state: stateRef.current,
          classId,
          questionTypeId,
        }));
      },
      manageSession: async (action: SessionAction) => {
        setState(manageSession({ state: stateRef.current, action }));
      },
      manageClass: async (action: ClassAction) => {
        setState(manageClass({ state: stateRef.current, action }));
      },
      exportData: async (filename: string) => {
        exportData({ state: stateRef.current, filename });
      },
      importData: async (
        jsonData: string,
      ): Promise<{ ok: true; value: undefined } | { ok: false; error: Error }> => {
        try {
          setState(importData({ currentState: stateRef.current, jsonData }));
          return { ok: true, value: undefined };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
      refreshState: () => refreshState(false),
      logout: async () => {
        setIsLoading(true);
        setInitializedStorage(null);
        activeRefreshIdRef.current = "logout"; // Block any pending refreshes
        try {
          if (supabase) {
            await supabase.auth.signOut();
          }
          setState(buildDefaultState());
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
      },
    }),
    [
      refreshState,
    ],
  );

  const value = useMemo(
    () => ({
      state,
      isLoading,
      user,
      isGuestMode,
      theme,
      actions: wrappedActions,
    }),
    [state, isLoading, user, isGuestMode, theme, wrappedActions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
