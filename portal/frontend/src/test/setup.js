import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = () => {};

// Cleanup after each test
afterEach(() => {
  cleanup();
});
