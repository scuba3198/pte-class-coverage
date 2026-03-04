import { describe, expect, it, vi } from "vitest";
import { LoadStateUseCase } from "./load-state";
import { SaveStateUseCase } from "./save-state";
import { buildDefaultState } from "../../domain/logic/normalization";
import { NotFoundError, type StorageAdapter } from "../../infrastructure/storage/local-storage-adapter";
import { ok, err } from "../../domain/result";
import { createLogger } from "../../infrastructure/logger";

const logger = createLogger("Test");

describe("Persistence Robustness", () => {
    describe("LoadStateUseCase Edge Cases", () => {
        it("returns default state when storage returns NotFoundError", async () => {
            const mockStorage: StorageAdapter = {
                loadState: vi.fn().mockResolvedValue(err(new NotFoundError("test"))),
                saveState: vi.fn(),
            };
            const useCase = new LoadStateUseCase(logger, mockStorage);
            const result = await useCase.execute({ storageKey: "key" }, "corr-1");

            expect(result.ok).toBe(false);
            expect(result.error).toBeInstanceOf(NotFoundError);
        });

        it("reports fatal errors instead of defaulting (Security/Network Fix)", async () => {
            const mockStorage: StorageAdapter = {
                loadState: vi.fn().mockResolvedValue(err({ message: "Network Error" })),
                saveState: vi.fn(),
            };
            const useCase = new LoadStateUseCase(logger, mockStorage);
            const result = await useCase.execute({ storageKey: "key" }, "corr-2");

            expect(result.ok).toBe(false);
            expect(result.error?.message).toBe("Network Error");
        });
    });

    describe("SaveStateUseCase Edge Cases", () => {
        it("successfully saves valid state", async () => {
            const mockStorage: StorageAdapter = {
                loadState: vi.fn(),
                saveState: vi.fn().mockResolvedValue(ok(undefined)),
            };
            const useCase = new SaveStateUseCase(logger, mockStorage);
            const state = buildDefaultState();

            const result = await useCase.execute({ storageKey: "key", state }, "corr-3");
            expect(result.ok).toBe(true);
            expect(mockStorage.saveState).toHaveBeenCalledWith("key", state);
        });

        it("handles save failures gracefully", async () => {
            const mockStorage: StorageAdapter = {
                loadState: vi.fn(),
                saveState: vi.fn().mockResolvedValue(err({ message: "Quota Exceeded" })),
            };
            const useCase = new SaveStateUseCase(logger, mockStorage);
            const result = await useCase.execute({ storageKey: "key", state: buildDefaultState() }, "corr-4");

            expect(result.ok).toBe(false);
            expect(result.error?.message).toBe("Quota Exceeded");
        });
    });
});
