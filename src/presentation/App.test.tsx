import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import type { AppState } from "../domain/types";

// Mock Supabase to prevent network calls and unexpected auth states
vi.mock("../infrastructure/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("requires guest mode or login to see content, then selects correct class", async () => {
    const storedState: AppState = {
      classes: [{ id: "class-9-10", name: "9-10" }],
      coverage: { "class-9-10": {} },
      sessions: { "class-9-10": [] },
    };
    window.localStorage.setItem("pte-tracker-state-v1", JSON.stringify(storedState));

    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );

    // 1. Wait for loading screen to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading PTE Tracker...")).toBeNull();
    });

    // 2. Verify we are on the login screen
    expect(screen.getByText("PTE Tracker Login")).toBeDefined();

    // 3. Click "Continue as Guest"
    const guestButton = screen.getByText("Continue as Guest");
    fireEvent.click(guestButton);

    // 4. Verify the main app UI appears
    await waitFor(() => {
      expect(screen.getByText("PTE Class Coverage")).toBeDefined();
    });

    // 5. Verify the class button "9-10" is present and active
    const classButtons = screen.getAllByRole("button", { name: "9-10" });
    expect(classButtons.length).toBeGreaterThanOrEqual(1);

    const activeButtons = classButtons.filter((b) => b.className.includes("active"));
    expect(activeButtons.length).toBeGreaterThan(0);
  });
});
