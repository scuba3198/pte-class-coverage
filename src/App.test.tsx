import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { AppState } from "./types";

// No network and no signed-in user.
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

const STORAGE_KEY = "pte-tracker-state-v1";

const openAsGuest = async () => {
  render(<App />);
  await screen.findByText("PTE Tracker Login");
  fireEvent.click(screen.getByText("Continue as Guest"));
  await screen.findByRole("heading", { level: 1, name: "PTE Class Coverage" });
};

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const ticks = (classId: string) => Object.values(saved().coverage[classId]!).filter(Boolean).length;

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("asks for login or guest mode, then shows the stored class as active", async () => {
    const stored: AppState = {
      classes: [{ id: "class-9-10", name: "9-10" }],
      coverage: { "class-9-10": {} },
      sessions: { "class-9-10": [] },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    render(<App />);
    await screen.findByText("PTE Tracker Login");
    fireEvent.click(screen.getByText("Continue as Guest"));
    await screen.findByRole("heading", { level: 1, name: "PTE Class Coverage" });

    const chip = screen.getByRole("button", { name: "9-10" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
  });

  it("adds a class from the class bar and makes it selectable", async () => {
    await openAsGuest();
    fireEvent.click(screen.getByRole("button", { name: "Add class" }));
    const input = screen.getByRole("textbox", { name: "New class name" });
    fireEvent.change(input, { target: { value: "11-12" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(saved().classes.map((c) => c.name)).toContain("11-12"));
    fireEvent.click(screen.getByRole("button", { name: "11-12" }));
    expect(screen.getByRole("button", { name: "11-12" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps every click when several happen before React re-renders", async () => {
    await openAsGuest();
    const buttons = screen.getAllByRole("button", { name: /marks$/ });
    fireEvent.click(buttons[0]!);
    fireEvent.click(buttons[1]!);
    await waitFor(() => expect(ticks("class-7-8")).toBe(2));
  });

  it("logs a session, marks it covered, and removes it again", async () => {
    await openAsGuest();
    const sessionCard = screen.getByRole("region", { name: "Log a session" });
    fireEvent.click(within(sessionCard).getAllByRole("button")[0]!);

    await waitFor(() => expect(saved().sessions["class-7-8"]).toHaveLength(1));
    expect(ticks("class-7-8")).toBe(1);

    fireEvent.click(await screen.findByRole("button", { name: "Remove session" }));
    await waitFor(() => expect(saved().sessions["class-7-8"]).toHaveLength(0));
  });

  it("shows an error, instead of crashing, when an invalid backup is imported", async () => {
    await openAsGuest();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["not json"], "backup.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByText("Invalid backup file format.");
  });
});
