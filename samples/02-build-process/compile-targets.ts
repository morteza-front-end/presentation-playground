// ============================================================
// 02 — BUILD PROCESS & COMPILE TARGETS
// File: compile-targets.ts
// Theme: emit vs type-check, default params, null vs undefined,
//        `target` downleveling, type erasure at runtime.
// ============================================================

// BUG #1 — Default parameters exist ONLY in the type-system / emit, never as a value
// reflected by `.length`. A function with a default param reports `.length` as the count
// of REQUIRED params (here: 0). Mixing up "optional" and "has a default" is a classic trap.
function greet(name = 'guest') {
  return `Hello, ${name}`;
}
// greet.length === 0, NOT 1. The default does NOT make `name` a real runtime argument.
console.log(greet.length);

// BUG #2 — `null` and `undefined` are DIFFERENT values, but under non-strict config they
// collapse. Here `exactOptionalPropertyTypes: true` makes `undefined` (omitted) != `null`.
type User = { id: number; nickname?: string };
const u: User = { id: 1, nickname: null };

// BUG #3 — Default param + explicit `undefined` passed in still falls back to default,
// but passing `null` does NOT (null is a real value). People expect symmetry — there is none.
function retry(attempts = 3) {
  return attempts;
}
retry(undefined); // => 3  (fallback used)
retry(null);      // BUG: `null` is not assignable to `number`.

// BUG #4 — `target` controls *emit*, `lib` controls *type availability*.
// `??` (nullish coalescing) needs target >= ES2020 to be emitted verbatim.
// Below ES2020 it is downleveled to a ternary via a helper. The TYPE is unaffected.
const maybe: number | null = null;
const value = maybe ?? 42;
// Type erasure: at runtime there is no `: number` anymore. `tsc` strips annotations,
// then the bundler/runme (tsx) runs the JS. Diagnostics live ONLY in the compiler.

// BUG #5 — `noImplicitReturns` forces every code path to return. This branch
// silently returns `undefined` for the string path.
function classify(score: number): number | string {
  if (score > 50) {
    return 'pass';
  }
  // Missing return on the else branch — flagged by noImplicitReturns.
}

console.log(greet(), classify(30));
