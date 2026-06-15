// ============================================================
// 04 — IDE SUPERPOWERS (the TS Server / tsserver)
// File: ts-server-demo.ts
// Theme: TSDoc hover, Map/Set type enforcement, quick-info,
//        the language service vs the compiler proper.
// ============================================================

/**
 * Formats a price for display.
 *
 * @param cents - amount in integer cents (e.g. 1299 => "$12.99")
 * @returns a localized currency string
 * @throws when cents is negative
 *
 * Hover this symbol in the editor: the TS Server reads the JSDoc and renders it
 * as rich Markdown hover. The *type* itself (number => string) is shown too.
 * The TSDoc is NOT part of the type — it is metadata surfaced by the language service.
 */
export function formatPrice(cents: number): string {
  if (cents < 0) throw new Error('negative');
  return (cents / 100).toFixed(2);
}

// BUG #1 — `Map<K, V>` enforces its type parameters on EVERY operation.
// Forgetting the V generic defaults it to `unknown`/`any`-ish and you lose safety.
const stock = new Map<string, number>();
stock.set('mouse', 12);
stock.set('keyboard', 'out'); // BUG: 'out' is not a number.

// BUG #2 — Set dedupes by SameValueZero. Objects are never equal even with same shape,
// because Set uses reference identity for objects. Two identical-looking objects => 2 entries.
const seen = new Set<{ id: number }>();
seen.add({ id: 1 });
seen.add({ id: 1 });
console.log(seen.size); // 2, NOT 1. Reference equality, not structural.

// BUG #3 — `.get` returns `V | undefined` under `noUncheckedIndexedAccess`-style safety.
// Forgetting the undefined branch is the #1 Map footgun.
const qty = stock.get('mouse');
const doubled: number = qty * 2; // BUG: qty is `number | undefined`.

// BUG #4 — Symbol-keyed properties are NOT enumerated by `for...in` or Object.keys.
// They live on a separate slot of the object. Reflection tools miss them.
const SECRET = Symbol('secret');
const obj: Record<string, number> & Record<typeof SECRET, number> = { a: 1, [SECRET]: 99 };
console.log(Object.keys(obj)); // ['a'] — symbol key invisible.

export { formatPrice as price };
