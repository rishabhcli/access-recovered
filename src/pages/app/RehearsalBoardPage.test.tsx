import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RehearsalBoardPage from "./RehearsalBoardPage";

const { navigateMock, saveRunMock, toastErrorMock, toastSuccessMock, useAuthMock, useOrgMock, useSimulationStoreMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  saveRunMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  useAuthMock: vi.fn(),
  useOrgMock: vi.fn(),
  useSimulationStoreMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/stores/simulation-store", () => ({
  useSimulationStore: useSimulationStoreMock,
}));

vi.mock("@/lib/services/runs", () => ({
  saveRun: saveRunMock,
}));

vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/lib/supabase/org-context", () => ({
  useOrg: useOrgMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@/components/board/SimulationBoard", () => ({
  SimulationBoard: () => <div>Board</div>,
}));

vi.mock("@/components/controls/InterventionTray", () => ({
  InterventionTray: () => <div>Tray</div>,
}));

vi.mock("@/components/shell/MetricStrip", () => ({
  MetricStrip: () => <div>Metrics</div>,
}));

vi.mock("@/components/panels/SidePanel", () => ({
  SidePanel: () => <div>Details</div>,
}));

vi.mock("@/components/panels/ProvenanceDrawer", () => ({
  ProvenanceDrawer: () => <div>Provenance</div>,
}));

describe("RehearsalBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: "user-1" } });
    useOrgMock.mockReturnValue({ currentOrg: { organization_id: "org-1" } });
    useSimulationStoreMock.mockReturnValue({
      loadDistrict: vi.fn(),
      selectScenario: vi.fn(),
      resetToFlooded: vi.fn(),
      resetToBaseline: vi.fn(),
      phase: "resolved",
      scenario: { slug: "severe-flash-flood" },
      armedIntervention: "temporary-bridge",
      selectedAnchor: "j-east-crossing",
      baselineMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
      floodedMetrics: { totalHouseholds: 612, householdsWithAccess: 328, isolatedClusters: 2 },
      resolvedMetrics: { totalHouseholds: 612, householdsWithAccess: 612, isolatedClusters: 0 },
      result: { narrative: "Run saved", householdsRestored: 284, clustersReconnected: 2 },
      edges: [],
      floodedEdges: [],
    });
  });

  it("saves a resolved run and navigates to the run detail page", async () => {
    const user = userEvent.setup();
    saveRunMock.mockResolvedValue("run-1");

    render(
      <MemoryRouter>
        <RehearsalBoardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /save run/i }));

    await waitFor(() => expect(saveRunMock).toHaveBeenCalled());
    expect(toastSuccessMock).toHaveBeenCalledWith("Run saved");
    expect(navigateMock).toHaveBeenCalledWith("/app/runs/run-1");
  });

  it("shows an error toast when saving fails", async () => {
    const user = userEvent.setup();
    saveRunMock.mockRejectedValue(new Error("Save failed"));

    render(
      <MemoryRouter>
        <RehearsalBoardPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /save run/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Save failed"));
  });
});
