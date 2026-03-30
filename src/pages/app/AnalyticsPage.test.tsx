import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/render";
import AnalyticsPage from "./AnalyticsPage";

const { fetchAuditLogsMock, fetchRecentRunsMock, useOrgMock } = vi.hoisted(() => ({
  fetchAuditLogsMock: vi.fn(),
  fetchRecentRunsMock: vi.fn(),
  useOrgMock: vi.fn(),
}));

vi.mock("@/lib/services/runs", () => ({
  fetchRecentRuns: fetchRecentRunsMock,
}));

vi.mock("@/lib/services/audit", () => ({
  fetchAuditLogs: fetchAuditLogsMock,
}));

vi.mock("@/lib/supabase/org-context", () => ({
  useOrg: useOrgMock,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
}));

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1" },
      currentRole: "admin",
    });
    fetchRecentRunsMock.mockResolvedValue([
      {
        id: "run-1",
        created_at: "2025-01-01T00:00:00.000Z",
        selected_intervention_slug: "temporary-bridge",
      },
    ]);
    fetchAuditLogsMock.mockResolvedValue([{ id: "log-1", action: "run.saved", actor_user_id: "user-1", created_at: "2025-01-01T00:00:00.000Z" }]);
  });

  it("renders summary stats for admins", async () => {
    renderPage();

    await waitFor(() => expect(fetchRecentRunsMock).toHaveBeenCalled());
    expect(screen.getByText("Total Runs")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText(/run · saved/i)).toBeInTheDocument();
  });

  it("shows the admin-only audit message for non-admins", async () => {
    useOrgMock.mockReturnValue({
      currentOrg: { organization_id: "org-1" },
      currentRole: "planner",
    });

    renderPage();

    expect(await screen.findByText(/organization admins only/i)).toBeInTheDocument();
  });
});
