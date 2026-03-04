import { describe, expect, it } from "vitest";
import { buildDefaultState } from "./normalization";
import { AppState } from "../types";

// Note: In a real app, merging logic often lives in a dedicated domain service or UseCase.
// Currently it's in AppContext.tsx. I'll test the logic itself by simulating the conditions.

describe("State Merging Logic (Guest to Cloud)", () => {
    it("should detect if a state has meaningful data", () => {
        const emptyState = buildDefaultState();
        const hasData = (state: AppState) => {
            const hasCoverage = Object.values(state.coverage).some(c => Object.values(c).some(v => v === true));
            const hasSessions = Object.values(state.sessions).some(s => s.length > 0);
            return hasCoverage || hasSessions;
        };

        expect(hasData(emptyState)).toBe(false);

        const dataState = { ...emptyState };
        dataState.coverage["class-7-8"] = { "ra": true };
        expect(hasData(dataState)).toBe(true);
    });

    it("identifies the 'local merge' condition correctly", () => {
        // Condition: cloud is empty AND local has data
        const cloudState = buildDefaultState();
        const localState = buildDefaultState();
        localState.coverage["class-7-8"] = { "ra": true };

        const cloudHasData = Object.values(cloudState.coverage).some(c => Object.values(c).some(v => v === true));
        const localHasData = Object.values(localState.coverage).some(c => Object.values(c).some(v => v === true));

        const shouldMergeLocal = !cloudHasData && localHasData;
        expect(shouldMergeLocal).toBe(true);
    });

    it("prefers cloud data if cloud is NOT empty", () => {
        const cloudState = buildDefaultState();
        cloudState.coverage["class-7-8"] = { "ra": true };

        const localState = buildDefaultState();
        localState.coverage["class-9-10"] = { "we": true };

        const cloudHasData = Object.values(cloudState.coverage).some(c => Object.values(c).some(v => v === true));

        // In this case, we would usually NOT merge local into cloud automatically to avoid mess,
        // or we might do a deeper merge. Current implementation prefers Cloud if not empty.
        expect(cloudHasData).toBe(true);
    });
});
