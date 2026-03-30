import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotFound from "./NotFound";

describe("NotFound", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the fallback page and logs the missing route", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      "404 Error: User attempted to access non-existent route:",
      "/missing",
    );
  });
});
