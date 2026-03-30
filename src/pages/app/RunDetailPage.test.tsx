import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import RunDetailPage from "./RunDetailPage";

const { fetchRunEventsMock, fetchRunMock, updateRunNotesMock } = vi.hoisted(() => ({
  fetchRunEventsMock: vi.fn(),
  fetchRunMock: vi.fn(),
  updateRunNotesMock: vi.fn(),
}));

vi.mock("@/lib/services/runs", () => ({
  fetchRun: fetchRunMock,
  fetchRunEvents: fetchRunEventsMock,
  updateRunNotes: updateRunNotesMock,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/runs/run-1"]}>
        <Routes>
          <Route path="/app/runs/:runId" element={<RunDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const runData = {
  id: "run-1",
  title: "Bridge Recovery",
  status: "resolved",
  created_at: "2025-01-01T00:00:00.000Z",
  created_by: "user-1",
  selected_intervention_slug: "temporary-bridge",
  selected_anchor_id: "j-east-crossing",
  baseline_metrics_json: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
  flooded_metrics_json: { totalHouseholds: 612, householdsWithAccess: 328, isolatedClusters: 2 },
  resolved_metrics_json: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
  result_summary_json: { narrative: "Bridge restores access", householdsRestored: 284, clustersReconnected: 2 },
  board_snapshot_before_json: [],
  board_snapshot_after_json: [],
  notes: "Initial notes",
  districts: { slug: "riverbend-east", name: "Riverbend East" },
  scenarios: { slug: "severe-flash-flood", label: "Severe Flash Flood", severity: "severe" },
};

describe("RunDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchRunMock.mockResolvedValue(runData);
    fetchRunEventsMock.mockResolvedValue([{ id: "event-1", event_type: "baseline", created_at: "2025-01-01T00:00:00.000Z" }]);
    updateRunNotesMock.mockResolvedValue(undefined);
  });

  it("renders run data and supports notes, export, copy, and print", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByRole("heading", { name: "Bridge Recovery" })).toBeInTheDocument());

    const notesField = screen.getByLabelText("Notes");
    await waitFor(() => expect(notesField).toHaveValue("Initial notes"));

    fireEvent.change(notesField, { target: { value: "Updated notes" } });
    expect(notesField).toHaveValue("Updated notes");

    await user.click(screen.getByRole("button", { name: /save notes/i }));

    await waitFor(() => expect(updateRunNotesMock).toHaveBeenCalledWith("run-1", "Updated notes"));

    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: /export json/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();

    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeTextSpy).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /print report/i }));
    expect(window.print).toHaveBeenCalled();
  });
});
