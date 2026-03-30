import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryBuilder, createSupabaseResult } from "@/test/supabase";
import { fetchAuditLogs, logAudit } from "./audit";

const { getUserMock, fromMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
}));

describe("audit service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts audit rows with the current actor", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const query = createQueryBuilder(createSupabaseResult([]));
    fromMock.mockReturnValueOnce(query);

    await logAudit({
      action: "run.saved",
      entity_type: "scenario_run",
      entity_id: "run-1",
      organization_id: "org-1",
      payload: { title: "Run 1" },
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "run.saved",
        actor_user_id: "user-1",
      }),
    );
  });

  it("returns ordered audit logs", async () => {
    const query = createQueryBuilder(createSupabaseResult([{ id: "log-1" }]));
    fromMock.mockReturnValueOnce(query);

    const logs = await fetchAuditLogs("org-1", 5);

    expect(query.eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(logs).toEqual([{ id: "log-1" }]);
  });
});
