import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { buildDefaultState, parseState } from "./state";
import { cloudStore, localStore } from "./storage";
import { supabase } from "./supabase";
import type { AppState } from "./types";

type Theme = "light" | "dark";
const THEME_KEY = "pte-tracker-theme";

const initialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be blocked; fall through to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/**
 * The tracker's state plus everything around it: who is signed in, where the state is stored
 * (the user's cloud row, or this browser as a guest), loading, auto-saving, and the theme.
 */
export const useTracker = () => {
  const [state, setState] = useState(buildDefaultState);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [isGuest, setIsGuest] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  // Which store `state` was loaded from. Changes are only saved after a successful load, so a
  // failed load can never overwrite what is stored.
  const [loaded, setLoaded] = useState<{ key: string; ok: boolean } | null>(null);
  const saves = useRef<Promise<void>>(Promise.resolve());

  const userId = user?.id ?? null;
  const storeKey = userId ?? "local";

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

  useEffect(() => {
    if (!authReady) return;
    let stale = false;
    const store = userId ? cloudStore(userId) : localStore;

    store
      .load()
      .then((raw) => (raw == null ? buildDefaultState() : parseState(raw)))
      .then((loadedState) => {
        if (stale) return;
        setState(loadedState);
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
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Not being able to remember the theme is harmless.
    }
  }, [theme]);

  return {
    state,
    update: (fn: (state: AppState) => AppState) => setState(fn),
    loading: !authReady || loaded?.key !== storeKey,
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
