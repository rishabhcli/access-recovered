import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import DistrictOverviewPage from "./DistrictOverviewPage";

const { fetchRecentRunsMock, useOrgMock } = vi.hoisted(() => ({
  fetchRecentRunsMock: vi.fn(),
  useOrgMock: vi.fn(),
}));

vi.mock("@/lib/services/runs", () => ({
  fetchRecentRuns: fetchRecentRunsMock,
}));

vi.mock("@/lib/supabase/org-context", () => ({
  useOrg: useOrgMock,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/districts/riverbend-east"]}>
        <Routes>
          <Route path="/app/districts/:districtSlug" element={<DistrictOverviewPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DistrictOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1" },
    });
  });

  it("renders district metadata and scenarios", async () => {
    fetchRecentRunsMock.mockResolvedValue([]);
    renderPage();

    await waitFor(() => expect(fetchRecentRunsMock).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /riverbend east/i })).toBeInTheDocument();
    expect(screen.getByText(/severe flash flood/i)).toBeInTheDocument();
    expect(screen.getByText(/moderate river rise/i)).toBeInTheDocument();
  });

  it("shows recent runs for the current district", async () => {
    fetchRecentRunsMock.mockResolvedValue([
      {
        id: "run-1",
        title: "District Run",
        created_at: "2025-01-01T00:00:00.000Z",
        selected_intervention_slug: "temporary-bridge",
        districts: { slug: "riverbend-east" },
      },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText("District Run")).toBeInTheDocument());
  });
});
