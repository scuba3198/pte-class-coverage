import React, { createContext, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Effect, Layer } from "effect";
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
import { createLogger, LoggerService } from "../../infrastructure/logger";
import { LocalStorageLive } from "../../infrastructure/storage/local-storage-adapter";
import { SupabaseStorageLive } from "../../infrastructure/storage/supabase-storage-adapter";
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
  const LoggerLive = useMemo(() => Layer.succeed(LoggerService, logger), [logger]);

  // Storage selection layer
  const storageLayer = useMemo(() => {
    if (user) return SupabaseStorageLive;
    return LocalStorageLive;
  }, [user]);

  // Combined App Layer
  const appLayer = useMemo(() => {
    return Layer.merge(LoggerLive, storageLayer);
  }, [LoggerLive, storageLayer]);

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

  // UseCases
  const loadStateUseCase = useMemo(() => new LoadStateUseCase(), []);
  const saveStateUseCase = useMemo(() => new SaveStateUseCase(), []);
  const toggleCoverageUseCase = useMemo(() => new ToggleCoverageUseCase(), []);
  const manageSessionUseCase = useMemo(() => new ManageSessionUseCase(), []);
  const manageClassUseCase = useMemo(() => new ManageClassUseCase(), []);
  const exportDataUseCase = useMemo(() => new ExportDataUseCase(), []);
  const importDataUseCase = useMemo(() => new ImportDataUseCase(), []);

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

      const program = loadStateUseCase.execute({ storageKey: STORAGE_KEY });

      try {
        const exit = await Effect.runPromiseExit(Effect.provide(program, appLayer));

        // Verify this is still the active (latest) refresh request
        if (activeRefreshIdRef.current !== correlationId) {
          logger.info("Refresh preempted by newer request, discarding", { correlationId });
          return;
        }

        const currentStorageType = user ? "supabase" : "local";

        if (exit._tag === "Success") {
          setState(exit.value);
          setInitializedStorage(currentStorageType);
        } else {
          const cause = exit.cause;
          if (cause._tag === "Fail" && cause.error._tag === "NotFoundError") {
            logger.info("No state found in storage, using default", { correlationId });
            setState(buildDefaultState());
            setInitializedStorage(currentStorageType);
          } else {
            const errorMsg = cause._tag === "Fail" ? cause.error.message : "Unexpected error";
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
    [loadStateUseCase, user, appLayer, logger],
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

    const program = saveStateUseCase.execute({ storageKey: STORAGE_KEY, state });
    Effect.runPromise(Effect.provide(program, appLayer));
  }, [state, initializedStorage, user, isLoading, saveStateUseCase, appLayer]);

  const wrappedActions = useMemo(
    () => ({
      toggleCoverage: async (classId: ClassId, questionTypeId: QuestionTypeId) => {
        const program = toggleCoverageUseCase.execute({
          state: stateRef.current,
          classId,
          questionTypeId,
        });
        const nextState = await Effect.runPromise(Effect.provide(program, appLayer));
        setState(nextState);
      },
      manageSession: async (action: SessionAction) => {
        const program = manageSessionUseCase.execute({ state: stateRef.current, action });
        const nextState = await Effect.runPromise(Effect.provide(program, appLayer));
        setState(nextState);
      },
      manageClass: async (action: ClassAction) => {
        const program = manageClassUseCase.execute({ state: stateRef.current, action });
        const nextState = await Effect.runPromise(Effect.provide(program, appLayer));
        setState(nextState);
      },
      exportData: async (filename: string) => {
        const program = exportDataUseCase.execute({ state: stateRef.current, filename });
        await Effect.runPromise(Effect.provide(program, appLayer));
      },
      importData: async (
        jsonData: string,
      ): Promise<{ ok: true; value: undefined } | { ok: false; error: Error }> => {
        const program = importDataUseCase.execute({ currentState: stateRef.current, jsonData });
        const exit = await Effect.runPromiseExit(Effect.provide(program, appLayer));
        if (exit._tag === "Success") {
          setState(exit.value);
          return { ok: true, value: undefined };
        } else {
          const errorMsg = exit.cause._tag === "Fail" ? exit.cause.error.message : "Import failed";
          return { ok: false, error: new Error(errorMsg) };
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
      toggleCoverageUseCase,
      manageSessionUseCase,
      manageClassUseCase,
      exportDataUseCase,
      importDataUseCase,
      appLayer,
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
