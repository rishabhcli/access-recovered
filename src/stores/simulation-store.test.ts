import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useSimulationStore } from "./simulation-store";

describe("simulation store", () => {
  beforeEach(() => {
    useSimulationStore.getState().loadDistrict();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the district baseline state", () => {
    const state = useSimulationStore.getState();

    expect(state.phase).toBe("baseline");
    expect(state.nodes).toHaveLength(20);
    expect(state.baselineMetrics?.householdsWithAccess).toBe(612);
  });

  it("selects and clears a scenario", () => {
    useSimulationStore.getState().selectScenario("severe-flash-flood");
    let state = useSimulationStore.getState();

    expect(state.phase).toBe("flooded");
    expect(state.floodedMetrics?.isolatedClusters).toBe(2);

    state.resetToBaseline();
    state = useSimulationStore.getState();

    expect(state.phase).toBe("baseline");
    expect(state.scenario).toBeNull();
  });

  it("arms and disarms interventions", () => {
    const store = useSimulationStore.getState();

    store.selectScenario("moderate-river-rise");
    store.armIntervention("temporary-bridge");
    expect(useSimulationStore.getState().phase).toBe("armed");
    expect(useSimulationStore.getState().armedIntervention).toBe("temporary-bridge");

    useSimulationStore.getState().disarmIntervention();
    expect(useSimulationStore.getState().phase).toBe("flooded");
    expect(useSimulationStore.getState().armedIntervention).toBeNull();
  });

  it("only accepts valid anchors for the armed intervention", () => {
    const store = useSimulationStore.getState();

    store.selectScenario("severe-flash-flood");
    store.armIntervention("temporary-bridge");
    store.selectAnchor("east-school-lot");
    expect(useSimulationStore.getState().selectedAnchor).toBeNull();

    store.selectAnchor("j-east-crossing");
    expect(useSimulationStore.getState().selectedAnchor).toBe("j-east-crossing");
  });

  it("executes an intervention and produces a resolved result", () => {
    vi.useFakeTimers();
    const store = useSimulationStore.getState();

    store.selectScenario("severe-flash-flood");
    store.armIntervention("temporary-bridge");
    store.selectAnchor("j-east-crossing");
    store.executeIntervention();

    expect(useSimulationStore.getState().phase).toBe("applying");

    vi.runAllTimers();

    const resolved = useSimulationStore.getState();
    expect(resolved.phase).toBe("resolved");
    expect(resolved.result?.householdsRestored).toBe(284);
    expect(resolved.result?.clustersReconnected).toBe(2);
    expect(resolved.result?.narrative).toMatch(/temporary bridge/i);
  });

  it("resets back to flooded after resolving a run", () => {
    vi.useFakeTimers();
    const store = useSimulationStore.getState();

    store.selectScenario("severe-flash-flood");
    store.armIntervention("temporary-bridge");
    store.selectAnchor("j-east-crossing");
    store.executeIntervention();
    vi.runAllTimers();

    useSimulationStore.getState().resetToFlooded();

    const reset = useSimulationStore.getState();
    expect(reset.phase).toBe("flooded");
    expect(reset.result).toBeNull();
    expect(reset.resolvedMetrics).toBeNull();
  });
});
