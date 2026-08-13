import { Data, Either, Schema } from "effect";
import { AppStateSchema, type AppState } from "../../domain/types";
import { supabase } from "../supabase";
import { createLogger } from "../logger";
import { NotFoundError, ValidationError, type StorageService } from "./storage-service";

export class SupabaseStorageError extends Data.TaggedError("SupabaseStorageError")<{
  readonly message: string;
}> {}

const logger = createLogger("Supabase");

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const supabaseStorageService: StorageService = {
  async loadState(key: string): Promise<AppState> {
    logger.info("Loading state from Supabase");

    let user: { id: string } | null;
    try {
      const result = await supabase.auth.getUser();
      user = result.data.user;
    } catch (error) {
      throw new SupabaseStorageError({ message: errorMessage(error) });
    }

    if (!user) throw new SupabaseStorageError({ message: "User not authenticated" });

    let result: {
      data: { data: unknown } | null;
      error: { code?: string; message: string } | null;
    };
    try {
      result = await supabase
        .from("pte_tracker_state")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
    } catch (error) {
      throw new SupabaseStorageError({ message: errorMessage(error) });
    }

    const { data, error } = result;
    if (error) {
      if (error.code === "42501") {
        logger.error("RLS Policy violation when loading state", { error: error.message });
        throw new SupabaseStorageError({ message: "Permission denied (RLS)" });
      }
      logger.error("Failed to fetch state from Supabase", {
        error: error.message,
        code: error.code,
      });
      throw new SupabaseStorageError({ message: error.message });
    }

    if (!data) {
      logger.info("No state found in Supabase for user");
      throw new NotFoundError({ key, message: `State not found for key: ${key}` });
    }

    const decoded = Schema.decodeUnknownEither(AppStateSchema)(data.data);
    if (Either.isLeft(decoded)) {
      logger.warn("Supabase data failed Schema validation");
      throw new ValidationError({ details: String(decoded.left), message: "Validation failed" });
    }

    return decoded.right;
  },

  async saveState(_key: string, state: AppState): Promise<void> {
    const tickCount = Object.values(state.coverage).reduce(
      (acc, coverage) => acc + Object.values(coverage).filter(Boolean).length,
      0,
    );
    const sessionCount = Object.values(state.sessions).reduce((acc, sessions) => acc + sessions.length, 0);
    logger.info("Saving state to Supabase", { ticks: tickCount, sessions: sessionCount });

    let user: { id: string } | null;
    try {
      const result = await supabase.auth.getUser();
      user = result.data.user;
    } catch (error) {
      throw new SupabaseStorageError({ message: errorMessage(error) });
    }

    if (!user) {
      logger.warn("Save aborted: No authenticated user");
      throw new SupabaseStorageError({ message: "User not authenticated" });
    }

    try {
      const { error } = await supabase.from("pte_tracker_state").upsert(
        {
          user_id: user.id,
          data: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) {
        logger.error("Failed to save state to Supabase", { error: error.message });
        throw new SupabaseStorageError({ message: error.message });
      }
    } catch (error) {
      if (error instanceof SupabaseStorageError) throw error;
      throw new SupabaseStorageError({ message: errorMessage(error) });
    }

    logger.info("State saved successfully to Supabase");
  },
};
