import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgProvider, useOrg } from "./org-context";

const { useAuthMock, acceptPendingInvitationsMock, fetchProfileMock, fetchUserOrgsMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  acceptPendingInvitationsMock: vi.fn(),
  fetchProfileMock: vi.fn(),
  fetchUserOrgsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/lib/services/organizations", () => ({
  acceptPendingInvitations: acceptPendingInvitationsMock,
  fetchProfile: fetchProfileMock,
  fetchUserOrgs: fetchUserOrgsMock,
}));

describe("OrgProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
    });
    fetchUserOrgsMock.mockResolvedValue([
      {
        organization_id: "org-1",
        role: "planner",
        organization: { id: "org-1", name: "Org One", slug: "org-one" },
      },
      {
        organization_id: "org-2",
        role: "admin",
        organization: { id: "org-2", name: "Org Two", slug: "org-two" },
      },
    ]);
  });

  it("selects the profile default org when it exists", async () => {
    fetchProfileMock.mockResolvedValue({ default_org_id: "org-2" });
    let orgApi: ReturnType<typeof useOrg> | null = null;

    function Capture() {
      orgApi = useOrg();
      return null;
    }

    render(
      <OrgProvider>
        <Capture />
      </OrgProvider>,
    );

    await waitFor(() => expect(orgApi?.loading).toBe(false));
    expect(acceptPendingInvitationsMock).toHaveBeenCalled();
    expect(orgApi?.currentOrg?.organization_id).toBe("org-2");
    expect(orgApi?.currentRole).toBe("admin");
  });

  it("falls back to the first org and allows switching", async () => {
    fetchProfileMock.mockResolvedValue({ default_org_id: "missing" });
    let orgApi: ReturnType<typeof useOrg> | null = null;

    function Capture() {
      orgApi = useOrg();
      return null;
    }

    render(
      <OrgProvider>
        <Capture />
      </OrgProvider>,
    );

    await waitFor(() => expect(orgApi?.loading).toBe(false));
    expect(orgApi?.currentOrg?.organization_id).toBe("org-1");

    await act(async () => {
      orgApi?.switchOrg("org-2");
    });
    await waitFor(() => expect(orgApi?.currentOrg?.organization_id).toBe("org-2"));
  });
});
