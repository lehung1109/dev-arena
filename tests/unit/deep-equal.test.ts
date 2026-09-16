import { describe, it, expect } from "vitest";
import { deepEqual, formatValue } from "@/lib/runner/deep-equal";

describe("Deep Equality Comparator (deepEqual)", () => {
  describe("Primitive values", () => {
    it("compares numbers correctly", () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(0, 0)).toBe(true);
      expect(deepEqual(-0, 0)).toBe(true);
      expect(deepEqual(42, -42)).toBe(false);
      expect(deepEqual(Infinity, Infinity)).toBe(true);
      expect(deepEqual(-Infinity, -Infinity)).toBe(true);
      expect(deepEqual(Infinity, -Infinity)).toBe(false);
    });

    it("handles NaN correctly (NaN equals NaN for test assertion purposes)", () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
      expect(deepEqual(NaN, 0)).toBe(false);
      expect(deepEqual(NaN, "NaN")).toBe(false);
    });

    it("compares strings correctly", () => {
      expect(deepEqual("hello", "hello")).toBe(true);
      expect(deepEqual("", "")).toBe(true);
      expect(deepEqual("hello", "world")).toBe(false);
      expect(deepEqual("1", 1)).toBe(false);
    });

    it("compares booleans correctly", () => {
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(true, 1)).toBe(false);
      expect(deepEqual(false, 0)).toBe(false);
    });

    it("compares null and undefined", () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(null, 0)).toBe(false);
      expect(deepEqual(undefined, "")).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
    });

    it("compares BigInt values", () => {
      expect(deepEqual(10n, 10n)).toBe(true);
      expect(deepEqual(10n, 20n)).toBe(false);
      expect(deepEqual(10n, 10)).toBe(false);
    });
  });

  describe("Arrays", () => {
    it("compares flat arrays with same elements and order", () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([], [])).toBe(true);
      expect(deepEqual(["a", "b"], ["a", "b"])).toBe(true);
    });

    it("fails when array order or lengths differ", () => {
      expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it("compares deeply nested arrays", () => {
      expect(deepEqual([[1, [2]], [3]], [[1, [2]], [3]])).toBe(true);
      expect(deepEqual([[1, [2]], [3]], [[1, [9]], [3]])).toBe(false);
      expect(deepEqual([[], [[]]], [[], [[]]])).toBe(true);
    });
  });

  describe("Objects", () => {
    it("compares flat objects regardless of key insertion order", () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(deepEqual({}, {})).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    });

    it("fails when keys are missing or extra keys exist", () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      expect(deepEqual({ a: undefined }, {})).toBe(false);
    });

    it("compares deeply nested objects", () => {
      const o1 = { user: { profile: { name: "Alice", scores: [10, 20] } } };
      const o2 = { user: { profile: { scores: [10, 20], name: "Alice" } } };
      const o3 = { user: { profile: { scores: [10, 30], name: "Alice" } } };

      expect(deepEqual(o1, o2)).toBe(true);
      expect(deepEqual(o1, o3)).toBe(false);
    });

    it("compares objects with array and mixed properties", () => {
      const a = { list: [{ id: 1, val: "x" }, { id: 2, val: "y" }] };
      const b = { list: [{ id: 1, val: "x" }, { id: 2, val: "y" }] };
      const c = { list: [{ id: 1, val: "x" }, { id: 2, val: "z" }] };

      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, c)).toBe(false);
    });
  });

  describe("Special object types (Date, RegExp)", () => {
    it("compares Date instances by timestamp value", () => {
      const d1 = new Date(1700000000000);
      const d2 = new Date(1700000000000);
      const d3 = new Date(1700000001000);

      expect(deepEqual(d1, d2)).toBe(true);
      expect(deepEqual(d1, d3)).toBe(false);
      expect(deepEqual(new Date("invalid"), new Date("invalid"))).toBe(true);
    });

    it("compares RegExp instances by source and flags", () => {
      expect(deepEqual(/abc/gi, /abc/gi)).toBe(true);
      expect(deepEqual(/abc/gi, /abc/g)).toBe(false);
      expect(deepEqual(/abc/g, /def/g)).toBe(false);
    });
  });

  describe("Cyclic references", () => {
    it("handles circular objects without infinite recursion", () => {
      const a: Record<string, unknown> = { name: "cycle" };
      a.self = a;

      const b: Record<string, unknown> = { name: "cycle" };
      b.self = b;

      expect(deepEqual(a, b)).toBe(true);

      const c: Record<string, unknown> = { name: "different" };
      c.self = c;
      expect(deepEqual(a, c)).toBe(false);
    });

    it("handles circular arrays without infinite recursion", () => {
      const arr1: unknown[] = [1];
      arr1.push(arr1);

      const arr2: unknown[] = [1];
      arr2.push(arr2);

      expect(deepEqual(arr1, arr2)).toBe(true);

      const arr3: unknown[] = [2];
      arr3.push(arr3);
      expect(deepEqual(arr1, arr3)).toBe(false);
    });
  });

  describe("formatValue helper", () => {
    it("formats primitives and nullish values cleanly", () => {
      expect(formatValue(42)).toBe("42");
      expect(formatValue("hello")).toBe('"hello"');
      expect(formatValue(true)).toBe("true");
      expect(formatValue(null)).toBe("null");
      expect(formatValue(undefined)).toBe("undefined");
      expect(formatValue(NaN)).toBe("NaN");
      expect(formatValue(Infinity)).toBe("Infinity");
      expect(formatValue(-Infinity)).toBe("-Infinity");
      expect(formatValue(100n)).toBe("100n");
    });

    it("formats arrays and objects", () => {
      expect(formatValue([1, 2, 3])).toBe("[1, 2, 3]");
      expect(formatValue({ a: 1 })).toBe('{"a": 1}');
    });

    it("formats circular structures without throwing", () => {
      const obj: Record<string, unknown> = { key: "value" };
      obj.self = obj;
      expect(() => formatValue(obj)).not.toThrow();
      const formatted = formatValue(obj);
      expect(formatted).toContain("[Circular]");
    });
  });
});
