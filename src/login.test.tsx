import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "./components/Login";

const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { auth } }));

const show = () => render(<Login onContinueAsGuest={() => {}} />);
const button = (name: string) => screen.getByRole("button", { name });

const submitEmail = () => {
  fireEvent.click(button("Continue with email"));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "t@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "not-a-real-one" } });
  fireEvent.click(button("Sign In"));
};

describe("Login", () => {
  beforeEach(() => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
  });
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("sends email and password to Supabase", () => {
    show();
    submitEmail();
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "t@example.com",
      password: "not-a-real-one",
    });
  });

  it("shows why an email sign-in failed and lets the teacher retry", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    show();
    submitEmail();
    expect((await screen.findByRole("alert")).textContent).toBe("Invalid login credentials");
    await waitFor(() => expect((button("Sign In") as HTMLButtonElement).disabled).toBe(false));
  });
});
