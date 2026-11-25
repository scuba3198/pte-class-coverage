import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { AppState, Workspace } from "./types";

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

/** The sign-in screen shares the app name, so wait for something only the tracker has. */
const findTracker = () => screen.findByRole("region", { name: "Classes" });

const openAsGuest = async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Continue as Guest" }));
  await findTracker();
};

const INSTITUTE = "institute-default";

const saved = (): Workspace =>
  (JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState).workspaces[INSTITUTE]!;
const ticks = (classId: string) => Object.values(saved().coverage[classId]!).filter(Boolean).length;

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("asks for login or guest mode, then shows the stored class as active", async () => {
    // Data saved before institutes existed is still read, as the default institute.
    const stored: Workspace = {
      classes: [{ id: "class-9-10", name: "9-10" }],
      coverage: { "class-9-10": {} },
      sessions: { "class-9-10": [] },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Continue as Guest" }));
    await findTracker();

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

  it("keeps each institute's coverage separate, and removes one with its data", async () => {
    await openAsGuest();
    fireEvent.click(screen.getAllByRole("button", { name: /marks$/ })[0]!);
    await waitFor(() => expect(ticks("class-7-8")).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: "Add institute" }));
    const input = screen.getByRole("textbox", { name: "New institute name" });
    fireEvent.change(input, { target: { value: "City College" } });
    fireEvent.submit(input.closest("form")!);

    const added = await screen.findByRole("button", { name: "City College" });
    expect(added.getAttribute("aria-pressed")).toBe("true");
    // The new institute starts with nothing covered.
    expect(screen.getByRole("button", { name: "Add institute" })).toBeDefined();

    const all = () => (JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppState).workspaces;
    const count = (w: Workspace) => Object.values(w.coverage["class-7-8"]!).filter(Boolean).length;
    await waitFor(() => expect(Object.values(all()).map(count).sort()).toEqual([0, 1]));

    // Choosing the first institute again keeps its own tick.
    fireEvent.click(screen.getByRole("button", { name: "My Institute" }));
    expect(screen.getByRole("button", { name: "My Institute" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "City College" }));
    const bar = screen.getByRole("region", { name: "Institutes" });
    fireEvent.click(within(bar).getByRole("button", { name: "Remove" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove institute" }));
    await waitFor(() => expect(Object.keys(all())).toHaveLength(1));
    expect(screen.queryByRole("button", { name: "City College" })).toBeNull();
  });

  it("returns a guest straight to their data after a reload", async () => {
    await openAsGuest();
    fireEvent.click(screen.getAllByRole("button", { name: /marks$/ })[0]!);
    await waitFor(() => expect(ticks("class-7-8")).toBe(1));

    cleanup();
    render(<App />);
    await findTracker();
    expect(screen.queryByRole("button", { name: "Continue as Guest" })).toBeNull();
    expect(ticks("class-7-8")).toBe(1);
  });

  it("collapses the session history and remembers it", async () => {
    await openAsGuest();
    const history = () => screen.getByRole("region", { name: /Session history/ });
    const details = () => history().querySelector("details")!;
    expect(details().open).toBe(true);

    fireEvent.click(within(history()).getByText(/Session history/));
    await waitFor(() => expect(details().open).toBe(false));

    cleanup();
    render(<App />);
    await findTracker();
    expect(details().open).toBe(false);
  });
});
