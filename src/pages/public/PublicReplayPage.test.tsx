import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSimulationStore } from "@/stores/simulation-store";
import PublicReplayPage from "./PublicReplayPage";

vi.mock("@/components/board/SimulationBoard", () => ({
  SimulationBoard: () => <div>Simulation board</div>,
}));

vi.mock("@/components/shell/MetricStrip", () => ({
  MetricStrip: () => <div>Metric strip</div>,
}));

describe("PublicReplayPage", () => {
  beforeEach(() => {
    useSimulationStore.getState().loadDistrict();
  });

  it("advances through the replay scenes", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PublicReplayPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/before flooding/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/east crossing fails/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/temporary bridge is selected/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(/284 households regain critical access/i)).toBeInTheDocument();
  });
});
