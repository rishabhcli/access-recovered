import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import { createQueryBuilder, createSupabaseResult } from "@/test/supabase";
import PublicRunReplayPage from "./PublicRunReplayPage";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/replay/run-1"]}>
        <Routes>
          <Route path="/replay/:runId" element={<PublicRunReplayPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PublicRunReplayPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public replay and supports sharing", async () => {
    fromMock
      .mockReturnValueOnce(
        createQueryBuilder(
          createSupabaseResult({
            id: "run-1",
            title: "Seeded Run",
            created_at: "2025-01-01T00:00:00.000Z",
            selected_intervention_slug: "temporary-bridge",
            selected_anchor_id: "j-east-crossing",
            baseline_metrics_json: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
            flooded_metrics_json: { totalHouseholds: 612, householdsWithAccess: 328, isolatedClusters: 2 },
            resolved_metrics_json: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
            result_summary_json: {
              narrative: "Seeded replay narrative",
              householdsRestored: 284,
              clustersReconnected: 2,
            },
            board_snapshot_before_json: [],
            board_snapshot_after_json: [],
            notes: "Read-only notes",
            districts: { slug: "riverbend-east", name: "Riverbend East" },
            scenarios: { slug: "severe-flash-flood", label: "Severe Flash Flood", severity: "severe" },
          }),
        ),
      )
      .mockReturnValueOnce(
        createQueryBuilder(
          createSupabaseResult([
            { id: "event-1", event_type: "baseline", created_at: "2025-01-01T00:00:00.000Z" },
          ]),
        ),
      );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getByRole("heading", { name: "Seeded Run" })).toBeInTheDocument());
    expect(screen.getByText(/seeded replay narrative/i)).toBeInTheDocument();

    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(screen.getByRole("button", { name: /share/i }));
    expect(writeTextSpy).toHaveBeenCalled();
  });

  it("shows an error state when the run query fails", async () => {
    fromMock
      .mockReturnValueOnce(createQueryBuilder(createSupabaseResult(null, new Error("not found"))))
      .mockReturnValueOnce(createQueryBuilder(createSupabaseResult([])));

    renderPage();

    await waitFor(() => expect(screen.getByText(/not found or not accessible/i)).toBeInTheDocument());
  });
});
