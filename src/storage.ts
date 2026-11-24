import { supabase } from "./supabase";
import { readPref, writePref } from "./prefs";
import type { AppState } from "./types";

const LOCAL_KEY = "pte-tracker-state-v1";
const SYNCED_KEY = "pte-tracker-synced-v1";
const TABLE = "pte_tracker_state";

/** Where the tracker state lives. `load` resolves to null when nothing has been saved yet. */
export interface Store {
  load(): Promise<unknown>;
  save(state: AppState): Promise<void>;
}

export const localStore: Store = {
  async load() {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async save(state) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  },
};

const client = () => {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
};

export const cloudStore = (userId: string): Store => ({
  async load() {
    const { data, error } = await client()
      .from(TABLE)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
  },
  async save(state) {
    const { error } = await client()
      .from(TABLE)
      .upsert(
        { user_id: userId, data: state, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw error;
  },
});

/** A short fingerprint of a state, enough to tell whether it changed since it was last synced. */
const fingerprint = (state: AppState) => {
  let hash = 2166136261;
  for (const char of JSON.stringify(state)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
};

const readSynced = (): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(readPref(SYNCED_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

/**
 * Remembers that this browser's guest data was reconciled with `userId`'s cloud data, so the
 * choice is only asked again once the guest data changes.
 */
export const markSynced = (userId: string, local: AppState) =>
  writePref(SYNCED_KEY, JSON.stringify({ ...readSynced(), [userId]: fingerprint(local) }));

export const isSynced = (userId: string, local: AppState) =>
  readSynced()[userId] === fingerprint(local);
