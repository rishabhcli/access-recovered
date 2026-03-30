import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryBuilder, createSupabaseResult } from "@/test/supabase";
import { fetchRecentRuns, saveRun, updateRunNotes } from "./runs";

const { getUserMock, fromMock, logAuditMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
  logAuditMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
}));

vi.mock("@/lib/services/audit", () => ({
  logAudit: logAuditMock,
}));

const saveRunParams = {
  districtSlug: "riverbend-east",
  scenarioSlug: "severe-flash-flood",
  interventionSlug: "temporary-bridge" as const,
  anchorId: "j-east-crossing",
  baselineMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0, clusterAccess: {} },
  floodedMetrics: { totalHouseholds: 612, householdsWithAccess: 328, isolatedClusters: 2, clusterAccess: {} },
  resolvedMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0, clusterAccess: {} },
  result: {
    interventionSlug: "temporary-bridge" as const,
    anchorId: "j-east-crossing",
    baselineMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0, clusterAccess: {} },
    floodedMetrics: { totalHouseholds: 612, householdsWithAccess: 328, isolatedClusters: 2, clusterAccess: {} },
    resolvedMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0, clusterAccess: {} },
    narrative: "Bridge reconnects 284 households.",
    householdsRestored: 284,
    clustersReconnected: 2,
  },
  floodedEdgesSnapshot: [],
  resolvedEdgesSnapshot: [],
  organizationId: "org-1",
};

describe("runs service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a run, creates replay events, and writes an audit entry", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const districtQuery = createQueryBuilder(createSupabaseResult({ id: "district-1" }));
    const scenarioQuery = createQueryBuilder(createSupabaseResult({ id: "scenario-1" }));
    const runInsertQuery = createQueryBuilder(createSupabaseResult({ id: "run-1" }));
    const eventInsertQuery = createQueryBuilder(createSupabaseResult([]));

    fromMock
      .mockReturnValueOnce(districtQuery)
      .mockReturnValueOnce(scenarioQuery)
      .mockReturnValueOnce(runInsertQuery)
      .mockReturnValueOnce(eventInsertQuery);

    const runId = await saveRun(saveRunParams);

    expect(runId).toBe("run-1");
    expect(runInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        selected_intervention_slug: "temporary-bridge",
      }),
    );
    expect(eventInsertQuery.insert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ event_type: "baseline" })]),
    );
    expect(logAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "run.saved",
        entity_id: "run-1",
      }),
    );
  });

  it("rejects unauthenticated saves", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(saveRun(saveRunParams)).rejects.toThrow("Not authenticated");
  });

  it("fails when the district lookup returns nothing", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromMock.mockReturnValueOnce(createQueryBuilder(createSupabaseResult(null)));

    await expect(saveRun(saveRunParams)).rejects.toThrow("District not found");
  });

  it("filters recent runs by organization when provided", async () => {
    const query = createQueryBuilder(createSupabaseResult([{ id: "run-1" }]));
    fromMock.mockReturnValueOnce(query);

    const runs = await fetchRecentRuns("org-1");

    expect(query.eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(runs).toEqual([{ id: "run-1" }]);
  });

  it("updates run notes", async () => {
    const query = createQueryBuilder(createSupabaseResult([]));
    fromMock.mockReturnValueOnce(query);

    await updateRunNotes("run-1", "Updated notes");

    expect(query.update).toHaveBeenCalledWith({ notes: "Updated notes" });
    expect(query.eq).toHaveBeenCalledWith("id", "run-1");
  });
});
