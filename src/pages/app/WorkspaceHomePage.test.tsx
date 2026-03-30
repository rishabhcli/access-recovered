import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import WorkspaceHomePage from "./WorkspaceHomePage";

const { fetchRecentRunsMock, useAuthMock, useOrgMock, useOnboardingStateMock } = vi.hoisted(() => ({
  fetchRecentRunsMock: vi.fn(),
  useAuthMock: vi.fn(),
  useOrgMock: vi.fn(),
  useOnboardingStateMock: vi.fn(),
}));

vi.mock("@/lib/services/runs", () => ({
  fetchRecentRuns: fetchRecentRunsMock,
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/lib/supabase/org-context", () => ({
  useOrg: useOrgMock,
}));

vi.mock("@/components/shell/LiveActivityBar", () => ({
  LiveActivityBar: () => <div>Live activity</div>,
}));

vi.mock("@/components/onboarding/OnboardingTutorial", () => ({
  OnboardingTutorial: () => <div>Onboarding modal</div>,
  useOnboardingState: useOnboardingStateMock,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WorkspaceHomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WorkspaceHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchRecentRunsMock.mockResolvedValue([]);
    useAuthMock.mockReturnValue({ signOut: vi.fn() });
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1", organization: { name: "Lifeline Team", slug: "lifeline-team" } },
      memberships: [{ organization_id: "org-1", organization: { name: "Lifeline Team", slug: "lifeline-team" } }],
      switchOrg: vi.fn(),
    });
    useOnboardingStateMock.mockReturnValue({
      show: false,
      complete: vi.fn(),
      dismiss: vi.fn(),
    });
  });

  it("shows the empty state when there are no recent runs", async () => {
    renderPage();

    await waitFor(() => expect(fetchRecentRunsMock).toHaveBeenCalled());
    expect(screen.getByText(/no saved runs yet/i)).toBeInTheDocument();
    expect(screen.getByText(/live activity/i)).toBeInTheDocument();
  });

  it("renders runs, onboarding, and supports sign out", async () => {
    const signOutMock = vi.fn();
    const user = userEvent.setup();
    fetchRecentRunsMock.mockResolvedValue([
      {
        id: "run-1",
        title: "Bridge Recovery",
        created_at: "2025-01-01T00:00:00.000Z",
        selected_intervention_slug: "temporary-bridge",
        districts: { name: "Riverbend East" },
      },
    ]);
    useAuthMock.mockReturnValue({ signOut: signOutMock });
    useOnboardingStateMock.mockReturnValue({
      show: true,
      complete: vi.fn(),
      dismiss: vi.fn(),
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Bridge Recovery")).toBeInTheDocument());
    expect(screen.getByText("Onboarding modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(signOutMock).toHaveBeenCalled();
  });
});
