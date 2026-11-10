import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(({ password }: { password: string }) =>
        password === "correct"
          ? Promise.resolve({ error: null })
          : Promise.resolve({ error: { message: "Invalid login credentials" } })
      ),
    },
  }),
}));

describe("LoginPage", () => {
  it("shows an error message on invalid credentials", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dad@anand.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument());
  });
});
