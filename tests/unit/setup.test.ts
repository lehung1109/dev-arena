import { describe, it, expect } from "vitest";

describe("Dev Arena Setup & Tooling Smoke Test", () => {
  it("verifies the test runner environment is active and passing", () => {
    expect(true).toBe(true);
  });

  it("verifies basic arithmetic sanity", () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});
