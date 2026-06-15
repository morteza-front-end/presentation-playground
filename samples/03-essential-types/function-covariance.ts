// ============================================================
// 03 — ESSENTIAL TYPES
// File: function-covariance.ts
// Theme: void vs undefined callbacks, object shapes,
//        bivariant vs strict function param checking.
// ============================================================

// BUG #1 — A callback returning a value is assignable to a `void`-returning signature.
// This is BY DESIGN (a "void" context accepts any return) so map/forEach work ergonomically.
// The trap: people think `void` means "must return nothing". It does not — it means
// "the return value will be IGNORED by the caller".
const nums = [1, 2, 3];
nums.forEach((n) => n * 2); // returns number, assignable to (n)=>void. No error. Intended.

// BUG #2 — The reverse is NOT true: a `void`-returning fn is NOT assignable to a
// signature expecting `undefined`, because `void` does not guarantee a `undefined` value
// (it can `return somethingElse` and the type system won't enforce absence).
type Callback = () => undefined;
const cb: Callback = () => {}; // BUG: `void`-ish return is not `undefined`.

// BUG #3 — Fresh object literal excess property check fires ONLY on the literal,
// not on a variable holding the same shape. This asymmetry confuses everyone.
type Point = { x: number; y: number };
const raw = { x: 1, y: 2, z: 3 };
const p1: Point = raw;         // OK — structural, no excess check on variables.
const p2: Point = { x: 1, y: 2, z: 3 }; // BUG: excess property `z` flagged on the literal.

// BUG #4 — Function parameter bivariance. Method shorthand syntax (`{m(x:string)}`)
// is checked BIVARIANTLY; arrow/property syntax is checked strictly (contravariantly).
// This is for class/method compatibility with arrays of subclasses. A footgun.
interface Speaker {
  say(text: string): void; // method => bivariant (lenient)
}
const loud: Speaker = {
  say(text: string | number) {
    console.log(text);
  },
};

// BUG #5 — Tuple vs array: positional vs rest. `[string, number]` is a fixed tuple,
// not "an array of string|number". Mutating it keeps the element types in their slots.
let pair: [string, number] = ['id', 7];
pair = [7, 'id']; // BUG: position 0 must be string.

console.log(nums, pair);
