// ============================================================
// 01 — START & SETUP
// File: tools-demo.ts
// Theme: String vs string, basic types, ts-node/tsx runtime
// ============================================================

// BUG #1 — Capital-S `String` (wrapper/object type) vs lowercase `string` (primitive).
// `String` describes the *boxed* object created by `new String(...)`, which is almost
// never what you want. Assigning a primitive literal to it "works" by accident because
// the primitive is structurally assignable to the object type — but it lies about intent.
const productName: String = 'Wireless Mouse';

// BUG #2 — Number/Boolean/Symbol wrappers, same trap.
const price: Number = 49.99;
const inStock: Boolean = true;

// BUG #3 — `null` is not assignable to `string` under strict mode
// (strictNullChecks is implied by `strict: true`).
let label: string = null;

// BUG #4 — Implicit any from a parameter with no annotation.
// `function format(n)` => `n` is implicitly `any`. Under `noImplicitAny` this errors.
function format(n) {
  return n.toFixed(2);
}

// BUG #5 — A variable typed as `any` defeats the purpose of TypeScript entirely.
// This compiles, runs, and silently produces `undefined` at runtime — the compiler
// cannot help you because you told it to look away.
const payload: any = 42;
const createdAt = payload.timestamp.iso;

console.log(productName, price, inStock, label, format(10));
