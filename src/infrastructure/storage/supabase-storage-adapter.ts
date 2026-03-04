import { supabase } from "../supabase";
import { DomainError, err, ok, type Result } from "../../domain/result";
import { AppStateSchema, type AppState } from "../../domain/types";
import type { Logger } from "../logger";
import { NotFoundError, type StorageAdapter, type StorageError } from "./local-storage-adapter";

export class SupabaseStorageError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private readonly logger: Logger) {}

  async loadState(key: string): Promise<Result<AppState, StorageError>> {
    try {
      this.logger.info("Loading state from Supabase");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return err(new SupabaseStorageError("User not authenticated") as any);
      }

      const { data, error } = await supabase
        .from("pte_tracker_state")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Check for RLS issues specifically
        if (error.code === "42501") {
          this.logger.error("RLS Policy violation when loading state", { error: error.message });
          return err(new SupabaseStorageError("Permission denied (RLS)") as any);
        }
        this.logger.error("Failed to fetch state from Supabase", {
          error: error.message,
          code: error.code,
        });
        return err(new SupabaseStorageError(error.message) as any);
      }

      if (!data) {
        this.logger.info("No state found in Supabase for user");
        return err(new NotFoundError(key));
      }

      const result = AppStateSchema.safeParse(data.data);
      if (!result.success) {
        this.logger.warn("Supabase data failed Zod validation");
        return err(new SupabaseStorageError("Validation failed") as any);
      }

      return ok(result.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error("Unexpected error loading from Supabase", { error: message });
      return err(new SupabaseStorageError(message) as any);
    }
  }

  async saveState(_key: string, state: AppState): Promise<Result<void, StorageError>> {
    try {
      // Count ticks for logging
      const tickCount = Object.values(state.coverage).reduce(
        (acc, c) => acc + Object.values(c).filter((v) => v === true).length,
        0,
      );
      const sessionCount = Object.values(state.sessions).reduce((acc, s) => acc + s.length, 0);

      this.logger.info("Saving state to Supabase", { ticks: tickCount, sessions: sessionCount });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        this.logger.warn("Save aborted: No authenticated user");
        return err(new SupabaseStorageError("User not authenticated") as any);
      }

      const { error } = await supabase.from("pte_tracker_state").upsert(
        {
          user_id: user.id,
          data: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        this.logger.error("Failed to save state to Supabase", { error: error.message });
        return err(new SupabaseStorageError(error.message) as any);
      }

      this.logger.info("State saved successfully to Supabase");
      return ok(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error("Unexpected error saving to Supabase", { error: message });
      return err(new SupabaseStorageError(message) as any);
    }
  }
}
