import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const createMotionComponent = (tagName: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(function MotionComponent(props, ref) {
      const { children, ...rest } = props;
      return React.createElement(tagName, { ...rest, ref }, children as React.ReactNode);
    });

  const motion = new Proxy(
    {},
    {
      get: (_, tagName: string) => createMotionComponent(tagName),
    },
  ) as Record<string, React.ComponentType<Record<string, unknown>>>;

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

const matchMediaListeners = new Set<(event: MediaQueryListEvent) => void>();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (listener: (event: MediaQueryListEvent) => void) => matchMediaListeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => matchMediaListeners.delete(listener),
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => matchMediaListeners.add(listener),
    removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => matchMediaListeners.delete(listener),
    dispatchEvent: (event: MediaQueryListEvent) => {
      matchMediaListeners.forEach((listener) => listener(event));
      return true;
    },
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, "print", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(globalThis.URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock"),
});

Object.defineProperty(globalThis.URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

beforeEach(() => {
  window.localStorage?.clear?.();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
