import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <div>Secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div>Auth Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while auth is resolving", () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    renderRoute();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("redirects unauthenticated users to auth", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    renderRoute();

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, loading: false });
    renderRoute();

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
