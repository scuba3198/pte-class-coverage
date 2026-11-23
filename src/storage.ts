import { supabase } from "./supabase";
import type { AppState } from "./types";

const LOCAL_KEY = "pte-tracker-state-v1";
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
