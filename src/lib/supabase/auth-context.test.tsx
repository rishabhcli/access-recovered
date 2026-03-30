import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";

const {
  getSessionMock,
  onAuthStateChangeMock,
  signInWithPasswordMock,
  signOutMock,
  signUpMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
  signUpMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      signUp: signUpMock,
    },
  },
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user?.id ?? "none"}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock,
        },
      },
    });
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
          },
        },
      },
    });
  });

  it("hydrates the initial session and exposes the user", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("user-1");
  });

  it("wraps sign in, sign up, and sign out", async () => {
    let authApi: ReturnType<typeof useAuth> | null = null;
    signInWithPasswordMock.mockResolvedValue({ error: null });
    signUpMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue(undefined);

    function Capture() {
      authApi = useAuth();
      return null;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );

    await waitFor(() => expect(authApi?.loading).toBe(false));

    await authApi?.signIn("user@example.com", "secret");
    await authApi?.signUp("user@example.com", "secret", "User");
    await authApi?.signOut();

    expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
    expect(signUpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
      options: { data: { full_name: "User" } },
    });
    expect(signOutMock).toHaveBeenCalled();
  });
});
