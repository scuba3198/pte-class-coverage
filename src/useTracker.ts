import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { readPref, writePref } from "./prefs";
import {
  buildDefaultState,
  isPristine,
  mergeStates,
  normalizeState,
  parseState,
  sameState,
} from "./state";
import { cloudStore, isSynced, localStore, markSynced } from "./storage";
import { supabase } from "./supabase";
import type { AppState } from "./types";

type Theme = "light" | "dark";
const THEME_KEY = "pte-tracker-theme";
const GUEST_KEY = "pte-tracker-guest-v1";
const INSTITUTE_KEY = "pte-tracker-institute-v1";

const initialTheme = (): Theme => {
  const stored = readPref(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/** Guest data on this device and the signed-in account's cloud data, which differ. */
export interface SyncChoice {
  userId: string;
  local: AppState;
  cloud: AppState;
}

export type SyncResolution = "merge" | "cloud";

const toState = (raw: unknown) => (raw == null ? buildDefaultState() : parseState(raw));

/**
 * The tracker's state plus everything around it: who is signed in, where the state is stored
 * (the user's cloud row, or this browser as a guest), loading, auto-saving, and the theme.
 */
export const useTracker = () => {
  const [state, setState] = useState(buildDefaultState);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  // Remembered, so a reload returns a guest to their data instead of the login screen.
  const [isGuest, setGuest] = useState(() => readPref(GUEST_KEY) === "1");
  const [theme, setTheme] = useState(initialTheme);
  const [instituteId, setInstituteId] = useState(() => readPref(INSTITUTE_KEY) ?? "");
  const [syncChoice, setSyncChoice] = useState<SyncChoice | null>(null);
  // Which store `state` was loaded from. Changes are only saved after a successful load, so a
  // failed load can never overwrite what is stored.
  const [loaded, setLoaded] = useState<{ key: string; ok: boolean } | null>(null);
  const saves = useRef<Promise<void>>(Promise.resolve());

  const userId = user?.id ?? null;
  const storeKey = userId ?? "local";

  const setIsGuest = (value: boolean) => {
    setGuest(value);
    writePref(GUEST_KEY, value ? "1" : "0");
  };

  useEffect(() => {
    if (!supabase) return;
    const setSessionUser = (next: User | null) => {
      setUser((prev) => (prev?.id === next?.id ? prev : next));
      // Signing in (even from another tab) ends guest mode, so a later sign-out shows the login screen.
      if (next) setIsGuest(false);
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSessionUser(session?.user ?? null),
    );
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSessionUser(session?.user ?? null))
      .catch((error) => console.error("Reading the saved session failed", error))
      .finally(() => setAuthReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  // Asks the browser not to evict guest data under storage pressure, so it lasts until cleared.
  useEffect(() => {
    if (isGuest) void navigator.storage?.persist?.()?.catch(() => {});
  }, [isGuest]);

  useEffect(() => {
    if (!authReady) return;
    let stale = false;
    setSyncChoice(null);

    const load = async (): Promise<{ state: AppState } | { choice: SyncChoice }> => {
      if (!userId) return { state: toState(await localStore.load()) };

      const cloud = toState(await cloudStore(userId).load());
      // Guest data that cannot be read is treated as empty; it must never block signing in.
      const local = await localStore.load().then(toState, buildDefaultState);
      const diverged = !isPristine(local) && !sameState(local, cloud) && !isSynced(userId, local);
      return diverged ? { choice: { userId, local, cloud } } : { state: cloud };
    };

    load()
      .then((result) => {
        if (stale) return;
        if ("choice" in result) return setSyncChoice(result.choice);
        setState(result.state);
        setLoaded({ key: storeKey, ok: true });
      })
      .catch((error) => {
        if (stale) return;
        console.error("Loading saved state failed; changes will not be saved", error);
        setState(buildDefaultState());
        setLoaded({ key: storeKey, ok: false });
      });
    return () => {
      stale = true;
    };
  }, [authReady, userId, storeKey]);

  useEffect(() => {
    if (!loaded?.ok || loaded.key !== storeKey) return;
    const store = userId ? cloudStore(userId) : localStore;
    // One save at a time, in order, so an older snapshot can never land after a newer one.
    saves.current = saves.current
      .then(() => store.save(state))
      .catch((error) => console.error("Saving state failed", error));
  }, [state, loaded, userId, storeKey]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writePref(THEME_KEY, theme);
  }, [theme]);

  /** Settles the sign-in question: merge both copies, or replace this device's copy with the cloud's. */
  const resolveSync = (resolution: SyncResolution) => {
    if (!syncChoice) return;
    const next = normalizeState(
      resolution === "merge" ? mergeStates(syncChoice.cloud, syncChoice.local) : syncChoice.cloud,
    );
    // Both copies now match. If the local write fails the question may simply be asked again.
    localStore
      .save(next)
      .then(() => markSynced(syncChoice.userId, next))
      .catch((error) => console.error("Updating this device's copy failed", error));
    setState(next);
    setLoaded({ key: syncChoice.userId, ok: true });
    setSyncChoice(null);
  };

  return {
    state,
    update: (fn: (state: AppState) => AppState) => setState(fn),
    institute: state.institutes.find((i) => i.id === instituteId) ?? state.institutes[0]!,
    selectInstitute: (id: string) => {
      setInstituteId(id);
      writePref(INSTITUTE_KEY, id);
    },
    loading: !authReady || (loaded?.key !== storeKey && !syncChoice),
    syncChoice,
    resolveSync,
    user,
    isGuest,
    setIsGuest,
    theme,
    toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    logout: async () => {
      await supabase?.auth.signOut();
      setIsGuest(false);
    },
  };
};
