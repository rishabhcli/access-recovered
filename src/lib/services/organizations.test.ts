import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryBuilder, createSupabaseResult } from "@/test/supabase";
import {
  acceptPendingInvitations,
  createInvitation,
  fetchOrgMembers,
  fetchUserOrgs,
  updateMemberRole,
} from "./organizations";

const { getUserMock, fromMock, rpcMock, logAuditMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  logAuditMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock("@/lib/services/audit", () => ({
  logAudit: logAuditMock,
}));

describe("organizations service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps user organizations from the nested Supabase response", async () => {
    const query = createQueryBuilder(
      createSupabaseResult([
        {
          organization_id: "org-1",
          role: "admin",
          organizations: { id: "org-1", name: "Team One", slug: "team-one" },
        },
      ]),
    );
    fromMock.mockReturnValueOnce(query);

    await expect(fetchUserOrgs()).resolves.toEqual([
      {
        organization_id: "org-1",
        role: "admin",
        organization: { id: "org-1", name: "Team One", slug: "team-one" },
      },
    ]);
  });

  it("hydrates member profiles from the second query", async () => {
    const rolesQuery = createQueryBuilder(
      createSupabaseResult([
        {
          id: "role-1",
          user_id: "user-1",
          role: "planner",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ]),
    );
    const profilesQuery = createQueryBuilder(
      createSupabaseResult([
        {
          id: "user-1",
          full_name: "Planner Person",
          avatar_url: null,
        },
      ]),
    );
    fromMock.mockReturnValueOnce(rolesQuery).mockReturnValueOnce(profilesQuery);

    await expect(fetchOrgMembers("org-1")).resolves.toEqual([
      expect.objectContaining({
        user_id: "user-1",
        profile: expect.objectContaining({ full_name: "Planner Person" }),
      }),
    ]);
  });

  it("creates invitations for authenticated users and logs audit", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const insertQuery = createQueryBuilder(createSupabaseResult([]));
    fromMock.mockReturnValueOnce(insertQuery);

    await createInvitation("org-1", "planner@example.com", "planner");

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        email: "planner@example.com",
        role: "planner",
      }),
    );
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invitation.sent",
      }),
    );
  });

  it("short-circuits invitation acceptance when there is no user email", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await acceptPendingInvitations();

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("updates member roles and logs audit", async () => {
    const query = createQueryBuilder(createSupabaseResult([]));
    fromMock.mockReturnValueOnce(query);

    await updateMemberRole("role-1", "viewer");

    expect(query.update).toHaveBeenCalledWith({ role: "viewer" });
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "member.role_changed",
        entity_id: "role-1",
      }),
    );
  });
});
