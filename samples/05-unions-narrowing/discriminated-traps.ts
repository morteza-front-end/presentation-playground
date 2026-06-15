// ============================================================
// 05 — UNIONS & NARROWING
// File: discriminated-traps.ts
// Theme: discriminated unions, early destructuring breaks
//        the correlation, `typeof null`, unknown vs never.
// ============================================================

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; w: number; h: number };

// BUG #1 — Early DESTRUCTURING of a discriminated union severs the link between
// `kind` and the payload. Once you pull `{ kind, radius }` out, the compiler treats
// them as independent values and CANNOT narrow `radius` based on `kind` anymore.
function areaBAD(shape: Shape) {
  const { kind, radius, size, w, h } = shape; // BUG: properties from OTHER members appear.
  if (kind === 'circle') return Math.PI * radius * radius; // radius may be undefined here
  return 0;
}

// The CORRECT pattern: narrow on the object first, THEN read its fields.
function areaOK(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius * shape.radius;
    case 'square':
      return shape.size * shape.size;
    case 'rect':
      return shape.w * shape.h;
  }
}

// BUG #2 — `typeof null === 'object'`. The classic. `typeof` returns 'object' for null,
// so narrowing with `typeof x === 'object'` does NOT exclude null.
function labelOf(x: string | null) {
  if (typeof x === 'object') {
    // x is STILL `null` here at the type level. This block is misleading.
    return x.length; // BUG: x is null, runtime throws.
  }
  return x;
}

// BUG #3 — `unknown` vs `any`. `unknown` forces you to narrow before use.
// People forget and treat it like `any` — the compiler (correctly) stops them.
function parse(raw: unknown) {
  raw.toUpperCase(); // BUG: `unknown` has no callable members. Narrow first.
  if (typeof raw === 'string') return raw.toUpperCase();
}

// BUG #4 — Exhaustiveness via `never`. If you add a new union member and forget a case,
// assigning the (un-narrowed) value to `never` explodes. This is THE idiomatic
// compile-time completeness check.
function assertNever(x: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(x)}`);
}
function describe(shape: Shape): string {
  switch (shape.kind) {
    case 'circle':
      return 'circle';
    case 'square':
      return 'square';
    case 'rect':
      return 'rect';
    default:
      // If a new member is added to Shape, this line becomes a compile error
      // because `shape` is no longer `never` here. Brilliant.
      return assertNever(shape);
  }
}

console.log(areaOK({ kind: 'circle', radius: 2 }), describe({ kind: 'square', size: 3 }));
