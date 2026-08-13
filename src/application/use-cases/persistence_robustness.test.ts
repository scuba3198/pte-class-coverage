import { describe, expect, it } from "vitest";
import { loadState } from "./load-state";
import { saveState } from "./save-state";
import { buildDefaultState } from "../../domain/logic/normalization";
import { StorageError, NotFoundError, type StorageService } from "../../infrastructure/storage/storage-service";

describe("Persistence Robustness", () => {
  describe("loadState edge cases", () => {
    it("propagates NotFoundError for the presentation fallback", async () => {
      const storage: StorageService = {
        loadState: async (key) => { throw new NotFoundError({ key, message: "test" }); },
        saveState: async () => undefined,
      };
      await expect(loadState(storage, { storageKey: "key" })).rejects.toBeInstanceOf(NotFoundError);
    });

    it("reports fatal errors instead of defaulting (Security/Network Fix)", async () => {
      const storage: StorageService = {
        loadState: async () => { throw new StorageError({ message: "Network Error" }); },
        saveState: async () => undefined,
      };
      await expect(loadState(storage, { storageKey: "key" })).rejects.toThrow("Network Error");
    });
  });

  describe("saveState edge cases", () => {
    it("handles save failures gracefully", async () => {
      const storage: StorageService = {
        loadState: async () => { throw new NotFoundError({ key: "key", message: "" }); },
        saveState: async () => { throw new StorageError({ message: "Quota Exceeded" }); },
      };
      await expect(saveState(storage, { storageKey: "key", state: buildDefaultState() })).rejects.toThrow("Quota Exceeded");
    });
  });
});
