import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("renders the hero and primary navigation", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole("heading", { name: /map the path/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute("href", "/replay/bridge-reconnect");
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: /open board/i })).toHaveAttribute(
      "href",
      "/app/rehearsal/riverbend-east",
    );
  });
});
