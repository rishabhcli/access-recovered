import { describe, expect, it } from "vitest";
import { RIVERBEND_EAST, SCENARIOS } from "@/data/seed/riverbend-east";
import {
  applyIntervention,
  applyScenario,
  computeAccessMetrics,
  generateNarrative,
} from "./engine";
import type { RunResult } from "./types";

describe("simulation engine", () => {
  it("computes full access in the baseline district", () => {
    const metrics = computeAccessMetrics(RIVERBEND_EAST.nodes, RIVERBEND_EAST.edges);

    expect(metrics.totalHouseholds).toBe(612);
    expect(metrics.householdsWithAccess).toBe(612);
    expect(metrics.isolatedClusters).toBe(0);
    expect(metrics.clusterAccess["cluster-east-a"]?.hasAccess).toBe(true);
  });

  it("isolates east-side clusters under the severe scenario", () => {
    const floodedEdges = applyScenario(RIVERBEND_EAST.edges, SCENARIOS[0]);
    const metrics = computeAccessMetrics(RIVERBEND_EAST.nodes, floodedEdges);

    expect(metrics.householdsWithAccess).toBe(328);
    expect(metrics.isolatedClusters).toBe(2);
    expect(metrics.clusterAccess["cluster-east-a"]?.hasAccess).toBe(false);
    expect(metrics.clusterAccess["cluster-east-b"]?.hasAccess).toBe(false);
  });

  it("marks blocked edges as temporary when placing a bridge", () => {
    const floodedEdges = applyScenario(RIVERBEND_EAST.edges, SCENARIOS[0]);
    const { edges } = applyIntervention(
      RIVERBEND_EAST.nodes,
      floodedEdges,
      "temporary-bridge",
      "j-east-crossing",
    );

    expect(edges.find((edge) => edge.id === "e05")?.status).toBe("temporary");
    expect(edges.find((edge) => edge.id === "e05")?.weight).toBe(Math.round(120 * 1.2));
    expect(edges.find((edge) => edge.id === "e06")?.status).toBe("temporary");
  });

  it("adds a temporary clinic node and edge when deploying a mobile clinic", () => {
    const { nodes, edges } = applyIntervention(
      RIVERBEND_EAST.nodes,
      RIVERBEND_EAST.edges,
      "mobile-clinic",
      "east-school-lot",
    );

    expect(nodes.find((node) => node.id === "temp-clinic-east-school-lot")?.facilityKind).toBe("clinic");
    expect(edges.find((edge) => edge.id === "temp-edge-clinic-east-school-lot")?.status).toBe("temporary");
  });

  it("restores degraded or blocked edges around the barrier-line anchor", () => {
    const floodedEdges = applyScenario(RIVERBEND_EAST.edges, SCENARIOS[0]);
    const { edges } = applyIntervention(
      RIVERBEND_EAST.nodes,
      floodedEdges,
      "barrier-line",
      "north-drain-corridor",
    );

    expect(edges.find((edge) => edge.id === "e14")?.status).toBe("restored");
  });

  it("adds a temporary shuttle edge to the east south junction", () => {
    const { edges } = applyIntervention(
      RIVERBEND_EAST.nodes,
      RIVERBEND_EAST.edges,
      "shuttle-link",
      "market-bus-turn",
    );

    expect(edges.find((edge) => edge.id === "temp-shuttle-market-bus-turn")).toMatchObject({
      from: "market-bus-turn",
      to: "j-east-south",
      status: "temporary",
    });
  });

  it("covers the narrative branches", () => {
    const baseResult: RunResult = {
      interventionSlug: "temporary-bridge",
      anchorId: "j-east-crossing",
      baselineMetrics: computeAccessMetrics(RIVERBEND_EAST.nodes, RIVERBEND_EAST.edges),
      floodedMetrics: computeAccessMetrics(RIVERBEND_EAST.nodes, applyScenario(RIVERBEND_EAST.edges, SCENARIOS[0])),
      resolvedMetrics: computeAccessMetrics(RIVERBEND_EAST.nodes, RIVERBEND_EAST.edges),
      narrative: "",
      householdsRestored: 284,
      clustersReconnected: 2,
    };

    expect(generateNarrative(baseResult)).toMatch(/reconnects 284 households/i);
    expect(generateNarrative({ ...baseResult, householdsRestored: 10, clustersReconnected: 0 })).toMatch(
      /restores access for 10 households/i,
    );
    expect(generateNarrative({ ...baseResult, interventionSlug: "mobile-clinic", householdsRestored: 0, clustersReconnected: 0 })).toMatch(
      /temporary care services/i,
    );
    expect(generateNarrative({ ...baseResult, interventionSlug: "barrier-line", householdsRestored: 0, clustersReconnected: 0 })).toMatch(
      /does not reconnect the east crossing/i,
    );
    expect(generateNarrative({ ...baseResult, interventionSlug: "shuttle-link", householdsRestored: 0, clustersReconnected: 0 })).toMatch(
      /impact on critical access is limited/i,
    );
  });
});
