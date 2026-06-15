// ============================================================
// 06 — OBJECTS & MUTABILITY
// File: readonly-assertions.ts
// Theme: shallow vs deep readonly, `as const`, Omit/Pick traps.
// ============================================================

// BUG #1 — `readonly` (in `interface`/`type`) and `Readonly<T>` are SHALLOW.
// The top-level array/object is frozen at the type level, but NESTED fields stay mutable.
// `Readonly<T>` is a Mapped Type: `{ readonly [K in keyof T]: T[K] }` — it does not recurse.
type Settings = Readonly<{ nested: { theme: string } }>;
const s: Settings = { nested: { theme: 'dark' } };
s.nested.theme = 'light'; // BUG-ish: NO error. Shallow readonly does not protect depth.

// BUG #2 — `as const` makes the WHOLE tree deeply readonly AND literal-typed.
// The trap: it also freezes the TYPES to their literal values, so you can't reassign
// a broader string later. `as const` is a "freeze the shape" assertion, not just immutability.
const palette = {
  primary: '#000',
  shades: [50, 100, 200],
} as const;
palette.primary = '#fff'; // BUG: cannot assign to readonly.
const shade: number = palette.shades[0]; // BUG: 50 is literal `50`, assignable but very narrow.

// BUG #3 — `Omit<T, K>` is implemented as `{ [P in Exclude<keyof T, K>]: T[P] }`.
// It operates on the DECLARED keys of T, so it CANNOT omit index-signature keys, and
// `Omit<Union, K>` is broken for unions (it distributes incorrectly — known TS limitation).
// You must use a custom DistributiveOmit.
type Todo = { id: number; title: string; done: boolean };
type TodoPreview = Omit<Todo, 'done'>;
const t: TodoPreview = { id: 1, title: 'x', done: false }; // BUG: excess `done`.

// BUG #4 — Distributive Omit over a union. Plain `Omit` does NOT distribute.
type A = { tag: 'a'; a: number };
type B = { tag: 'b'; b: string };
type AB = A | B;
type NoTag = Omit<AB, 'tag'>; // BUG: this is `{ a?: number; b?: string }` — WRONG.
// Correct distributive version:
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

// BUG #5 — `const` binding ≠ `readonly` type. `const` prevents REBINDING the variable,
// but the object it points to is fully mutable. Two completely different concepts.
const config = { retries: 3 };
config.retries = 99; // perfectly legal — `const` only froze the binding, not the value.

console.log(s, palette, config);
