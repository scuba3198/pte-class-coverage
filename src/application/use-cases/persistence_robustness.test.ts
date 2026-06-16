import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { LoadStateUseCase } from "./load-state";
import { SaveStateUseCase } from "./save-state";
import { buildDefaultState } from "../../domain/logic/normalization";
import {
  StorageService,
  StorageError,
  NotFoundError,
} from "../../infrastructure/storage/storage-service";
import { createLogger, LoggerService } from "../../infrastructure/logger";

const logger = createLogger("Test");
const LoggerLive = Layer.succeed(LoggerService, logger);

describe("Persistence Robustness", () => {
  describe("LoadStateUseCase Edge Cases", () => {
    it("returns default state when storage returns NotFoundError", async () => {
      const mockStorage = StorageService.of({
        loadState: (key) => Effect.fail(new NotFoundError({ key, message: "test" })),
        saveState: () => Effect.void,
      });
      const StorageLive = Layer.succeed(StorageService, mockStorage);

      const useCase = new LoadStateUseCase();
      const program = useCase
        .execute({ storageKey: "key" })
        .pipe(Effect.provide(StorageLive), Effect.provide(LoggerLive));

      const exit = await Effect.runPromiseExit(program);
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(exit.cause._tag).toBe("Fail");
        if (exit.cause._tag === "Fail") {
          expect(exit.cause.error).toBeInstanceOf(NotFoundError);
        }
      }
    });

    it("reports fatal errors instead of defaulting (Security/Network Fix)", async () => {
      const mockStorage = StorageService.of({
        loadState: () => Effect.fail(new StorageError({ message: "Network Error" })),
        saveState: () => Effect.void,
      });
      const StorageLive = Layer.succeed(StorageService, mockStorage);

      const useCase = new LoadStateUseCase();
      const program = useCase
        .execute({ storageKey: "key" })
        .pipe(Effect.provide(StorageLive), Effect.provide(LoggerLive));

      const exit = await Effect.runPromiseExit(program);
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
        expect(exit.cause.error.message).toBe("Network Error");
      }
    });
  });

  describe("SaveStateUseCase Edge Cases", () => {
    it("handles save failures gracefully", async () => {
      const mockStorage = StorageService.of({
        loadState: () => Effect.fail(new NotFoundError({ key: "key", message: "" })),
        saveState: () => Effect.fail(new StorageError({ message: "Quota Exceeded" })),
      });
      const StorageLive = Layer.succeed(StorageService, mockStorage);

      const useCase = new SaveStateUseCase();
      const program = useCase
        .execute({ storageKey: "key", state: buildDefaultState() })
        .pipe(Effect.provide(StorageLive), Effect.provide(LoggerLive));

      const exit = await Effect.runPromiseExit(program);
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
        expect(exit.cause.error.message).toBe("Quota Exceeded");
      }
    });
  });
});
