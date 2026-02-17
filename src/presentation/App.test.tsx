import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import type { AppState } from "../domain/types";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("selects the first stored class when the default is missing", async () => {
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

    // Wait for the async state loading to finish and loading screen to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading PTE Tracker...")).toBeNull();
    });

    // We can't query by class name directly if it matches multiple things,
    // but the chip should be visible.
    // The ClassBar renders buttons for likely class names.
    const classButtons = screen.getAllByRole("button", { name: "9-10" });
    // One in ClassBar, one in ClassEditor
    expect(classButtons.length).toBeGreaterThanOrEqual(1);

    // Check if one of them is active. The active one in ClassBar has .active class.
    const activeButtons = classButtons.filter((b) => b.className.includes("active"));
    expect(activeButtons.length).toBeGreaterThan(0);
  });
});
