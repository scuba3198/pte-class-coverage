import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { buildDefaultState, DEFAULT_INSTITUTE_ID, editWorkspace, toggleCoverage } from "./state";
import type { AppState } from "./types";

const LOCAL_KEY = "pte-tracker-state-v1";

// A signed-in user whose cloud row is whatever `cloud.row` holds; saves land in `cloud.saved`.
const cloud = vi.hoisted(() => ({ row: null as unknown, saved: [] as unknown[] }));

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { user: { id: "u1", email: "a@b.c" } } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: cloud.row ? { data: cloud.row } : null, error: null }),
        }),
      }),
      upsert: (row: { data: unknown }) => {
        cloud.saved.push(row.data);
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

const withTick = (classId: string, typeId: string): AppState =>
  editWorkspace(buildDefaultState(), DEFAULT_INSTITUTE_ID, (w) =>
    toggleCoverage(w, classId, typeId),
  );

const ticked = (state: AppState, classId: string, typeId: string) =>
  state.workspaces[DEFAULT_INSTITUTE_ID]!.coverage[classId]![typeId];

const appReady = () => screen.findByRole("heading", { level: 1, name: "PTE Class Coverage" });

describe("signing in with guest data on this device", () => {
  beforeEach(() => {
    localStorage.clear();
    cloud.row = null;
    cloud.saved = [];
  });
  afterEach(cleanup);

  const guestData = withTick("class-7-8", "read-aloud");
  const cloudData = withTick("class-8-9", "describe-image");

  it("goes straight to the app when the guest data is untouched", async () => {
    cloud.row = cloudData;
    render(<App />);
    await appReady();
  });

  it("merges both copies when asked, and writes the result to both places", async () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(guestData));
    cloud.row = cloudData;
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Merge both" }));
    await appReady();

    await waitFor(() => expect(cloud.saved).toHaveLength(1));
    const merged = cloud.saved[0] as AppState;
    expect(ticked(merged, "class-7-8", "read-aloud")).toBe(true);
    expect(ticked(merged, "class-8-9", "describe-image")).toBe(true);
    await waitFor(() => expect(JSON.parse(localStorage.getItem(LOCAL_KEY)!)).toEqual(merged));
  });

  it("replaces the guest copy with the cloud data when asked", async () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(guestData));
    cloud.row = cloudData;
    render(<App />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Overwrite this browser with cloud data" }),
    );
    await appReady();

    await waitFor(() => {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY)!) as AppState;
      expect(ticked(local, "class-7-8", "read-aloud")).toBe(false);
      expect(ticked(local, "class-8-9", "describe-image")).toBe(true);
    });
  });

  it("does not ask again once the two copies were reconciled", async () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(guestData));
    cloud.row = cloudData;
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Merge both" }));
    await appReady();
    await waitFor(() => expect(cloud.saved).toHaveLength(1));

    // The cloud moves on while this browser's guest copy stays as it was reconciled.
    cleanup();
    cloud.row = withTick("class-9-10", "write-essay");
    render(<App />);
    await appReady();
    expect(screen.queryByRole("button", { name: "Merge both" })).toBeNull();
  });
});
