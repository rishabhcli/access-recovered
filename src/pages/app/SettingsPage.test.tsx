import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import SettingsPage from "./SettingsPage";

const {
  createInvitationMock,
  fetchAuditLogsMock,
  fetchOrgInvitationsMock,
  fetchOrgMembersMock,
  toastErrorMock,
  toastSuccessMock,
  useAuthMock,
  useOrgMock,
} = vi.hoisted(() => ({
  createInvitationMock: vi.fn(),
  fetchAuditLogsMock: vi.fn(),
  fetchOrgInvitationsMock: vi.fn(),
  fetchOrgMembersMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  useAuthMock: vi.fn(),
  useOrgMock: vi.fn(),
}));

vi.mock("@/lib/services/organizations", () => ({
  fetchOrgMembers: fetchOrgMembersMock,
  fetchOrgInvitations: fetchOrgInvitationsMock,
  createInvitation: createInvitationMock,
  deleteInvitation: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}));

vi.mock("@/lib/services/audit", () => ({
  fetchAuditLogs: fetchAuditLogsMock,
}));

vi.mock("@/lib/supabase/org-context", () => ({
  useOrg: useOrgMock,
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@/components/onboarding/OnboardingTutorial", () => ({
  OnboardingTutorial: () => <div>Tutorial</div>,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchOrgMembersMock.mockResolvedValue([
      {
        id: "member-1",
        user_id: "user-1",
        role: "admin",
        created_at: "2025-01-01T00:00:00.000Z",
        profile: { full_name: "Admin User", avatar_url: null },
      },
    ]);
    fetchOrgInvitationsMock.mockResolvedValue([]);
    fetchAuditLogsMock.mockResolvedValue([]);
    useAuthMock.mockReturnValue({ user: { id: "user-1" } });
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1", organization: { name: "Lifeline Team" } },
      currentRole: "admin",
      refetch: vi.fn(),
    });
  });

  it("allows admins to invite members", async () => {
    createInvitationMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Invite email"), "planner@example.com");
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => expect(createInvitationMock).toHaveBeenCalledWith("org-1", "planner@example.com", "planner"));
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("shows the admin-only recent activity message for non-admins", async () => {
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1", organization: { name: "Lifeline Team" } },
      currentRole: "viewer",
      refetch: vi.fn(),
    });

    renderPage();

    expect(await screen.findByText(/organization admins only/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send invitation/i })).not.toBeInTheDocument();
  });
});
