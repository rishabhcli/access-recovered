import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import AuthPage from "./AuthPage";

const { navigateMock, useAuthMock, signInMock, signUpMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      signUp: signUpMock,
      user: null,
    });
  });

  it("signs a user in and navigates to the app", async () => {
    signInMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<AuthPage />);

    await user.type(screen.getByLabelText("Email"), "planner@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(signInMock).toHaveBeenCalledWith("planner@example.com", "secret123"));
    expect(navigateMock).toHaveBeenCalledWith("/app");
  });

  it("supports sign up mode and shows the confirmation notice", async () => {
    signUpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<AuthPage />);

    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    await user.type(screen.getByLabelText("Full Name"), "Planner Person");
    await user.type(screen.getByLabelText("Email"), "planner@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith("planner@example.com", "secret123", "Planner Person"),
    );
    expect(screen.getByText(/check your email to confirm your account/i)).toBeInTheDocument();
  });
});
