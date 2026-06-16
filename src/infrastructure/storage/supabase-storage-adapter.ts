import { Effect, Layer, Schema, Either, Data } from "effect";
import { supabase } from "../supabase";
import { AppStateSchema, type AppState } from "../../domain/types";
import { LoggerService } from "../logger";
import { StorageService, NotFoundError, ValidationError } from "./storage-service";

export class SupabaseStorageError extends Data.TaggedError("SupabaseStorageError")<{
  readonly message: string;
}> {}

export class SupabaseStorageAdapter {
  loadState(key: string) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Loading state from Supabase");

      const userPromise = Effect.tryPromise({
        try: () => supabase.auth.getUser(),
        catch: (e) =>
          new SupabaseStorageError({ message: e instanceof Error ? e.message : String(e) }),
      });
      const {
        data: { user },
      } = yield* userPromise;
      if (!user) {
        return yield* Effect.fail(new SupabaseStorageError({ message: "User not authenticated" }));
      }

      const queryPromise = Effect.tryPromise({
        try: () =>
          supabase.from("pte_tracker_state").select("data").eq("user_id", user.id).maybeSingle(),
        catch: (e) =>
          new SupabaseStorageError({ message: e instanceof Error ? e.message : String(e) }),
      });
      const { data, error } = yield* queryPromise;

      if (error) {
        if (error.code === "42501") {
          logger.error("RLS Policy violation when loading state", { error: error.message });
          return yield* Effect.fail(
            new SupabaseStorageError({ message: "Permission denied (RLS)" }),
          );
        }
        logger.error("Failed to fetch state from Supabase", {
          error: error.message,
          code: error.code,
        });
        return yield* Effect.fail(new SupabaseStorageError({ message: error.message }));
      }

      if (!data) {
        logger.info("No state found in Supabase for user");
        return yield* Effect.fail(
          new NotFoundError({ key, message: `State not found for key: ${key}` }),
        );
      }

      const decoded = Schema.decodeUnknownEither(AppStateSchema)(data.data);
      if (Either.isLeft(decoded)) {
        logger.warn("Supabase data failed Schema validation");
        return yield* Effect.fail(
          new ValidationError({ details: String(decoded.left), message: "Validation failed" }),
        );
      }

      return decoded.right;
    });
  }

  saveState(_key: string, state: AppState) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;

      const tickCount = Object.values(state.coverage).reduce(
        (acc, c) => acc + Object.values(c).filter((v) => v === true).length,
        0,
      );
      const sessionCount = Object.values(state.sessions).reduce((acc, s) => acc + s.length, 0);

      logger.info("Saving state to Supabase", { ticks: tickCount, sessions: sessionCount });

      const userPromise = Effect.tryPromise({
        try: () => supabase.auth.getUser(),
        catch: (e) =>
          new SupabaseStorageError({ message: e instanceof Error ? e.message : String(e) }),
      });
      const {
        data: { user },
      } = yield* userPromise;
      if (!user) {
        logger.warn("Save aborted: No authenticated user");
        return yield* Effect.fail(new SupabaseStorageError({ message: "User not authenticated" }));
      }

      const upsertPromise = Effect.tryPromise({
        try: () =>
          supabase.from("pte_tracker_state").upsert(
            {
              user_id: user.id,
              data: state,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
        catch: (e) =>
          new SupabaseStorageError({ message: e instanceof Error ? e.message : String(e) }),
      });
      const { error } = yield* upsertPromise;

      if (error) {
        logger.error("Failed to save state to Supabase", { error: error.message });
        return yield* Effect.fail(new SupabaseStorageError({ message: error.message }));
      }

      logger.info("State saved successfully to Supabase");
    });
  }
}

export const SupabaseStorageLive = Layer.effect(
  StorageService,
  Effect.sync(() => {
    const adapter = new SupabaseStorageAdapter();
    return StorageService.of({
      loadState: (key) => adapter.loadState(key),
      saveState: (key, state) => adapter.saveState(key, state),
    });
  }),
);
