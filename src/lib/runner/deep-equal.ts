/**
 * Deep Equality Comparator & Value Formatter
 * Dev Arena - 001-in-browser-code-arena
 */

export function deepEqual(
  a: unknown,
  b: unknown,
  seen: Map<object, object> = new Map()
): boolean {
  // Standard strict equality or Object.is (handles -0 === 0, +0, primitives, and same reference)
  if (a === b || Object.is(a, b)) {
    return true;
  }

  // Handle NaN equality for test assertions: NaN === NaN -> true
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true;
    }
  }

  // If either is null or not an object (primitive), they cannot be equal since checks above failed
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  const objA = a as object;
  const objB = b as object;

  // Handle cyclic references
  if (seen.has(objA)) {
    return seen.get(objA) === objB;
  }
  seen.set(objA, objB);

  // Date instances comparison
  if (objA instanceof Date && objB instanceof Date) {
    return (
      objA.getTime() === objB.getTime() ||
      (Number.isNaN(objA.getTime()) && Number.isNaN(objB.getTime()))
    );
  }

  // RegExp instances comparison
  if (objA instanceof RegExp && objB instanceof RegExp) {
    return objA.source === objB.source && objA.flags === objB.flags;
  }

  // Array comparison
  const isArrA = Array.isArray(objA);
  const isArrB = Array.isArray(objB);

  if (isArrA !== isArrB) {
    return false;
  }

  if (isArrA && isArrB) {
    const arrA = objA as unknown[];
    const arrB = objB as unknown[];

    if (arrA.length !== arrB.length) {
      return false;
    }

    for (let i = 0; i < arrA.length; i++) {
      if (!deepEqual(arrA[i], arrB[i], seen)) {
        return false;
      }
    }
    return true;
  }

  // Object comparison
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  const recordB = objB as Record<string, unknown>;
  const recordA = objA as Record<string, unknown>;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
    if (!deepEqual(recordA[key], recordB[key], seen)) {
      return false;
    }
  }

  return true;
}

/**
 * Format any JavaScript value into a human-readable string without throwing on circular structures.
 */
export function formatValue(
  val: unknown,
  seen: WeakSet<object> = new WeakSet()
): string {
  if (val === undefined) return "undefined";
  if (val === null) return "null";

  if (typeof val === "number") {
    if (Number.isNaN(val)) return "NaN";
    if (val === Infinity) return "Infinity";
    if (val === -Infinity) return "-Infinity";
    return String(val);
  }

  if (typeof val === "bigint") {
    return `${val}n`;
  }

  if (typeof val === "string") {
    return JSON.stringify(val);
  }

  if (typeof val === "boolean") {
    return String(val);
  }

  if (typeof val === "function") {
    return val.name ? `[Function: ${val.name}]` : "[Function]";
  }

  if (typeof val === "object") {
    if (seen.has(val)) {
      return "[Circular]";
    }
    seen.add(val);

    if (Array.isArray(val)) {
      const items = val.map((item) => formatValue(item, seen));
      return `[${items.join(", ")}]`;
    }

    if (val instanceof Date) {
      return `Date(${val.toISOString()})`;
    }

    if (val instanceof RegExp) {
      return String(val);
    }

    const entries = Object.entries(val).map(
      ([k, v]) => `${JSON.stringify(k)}: ${formatValue(v, seen)}`
    );
    return `{${entries.join(", ")}}`;
  }

  return String(val);
}
