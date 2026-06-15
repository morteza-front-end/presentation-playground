// ============================================================
// samples/index.ts — the presentation registry.
// The UI imports this to render the sidebar + cheat sheet.
// Each entry links a raw .ts source (for Monaco) to its deep
// analytical explanation (for the presenter panel).
// ============================================================

import type { Component } from 'vue';

export interface SampleEntry {
  id: string;
  section: number;
  title: string;
  subtitle: string;
  /** Relative path under /samples, used to fetch raw source via $fetch at runtime. */
  file: string;
  /** Raw source string — injected by the loader composable, left empty here. */
  code?: string;
  /** Deep markdown explanation shown in the "Cheat Sheet" tab. */
  cheatSheet: string;
  /** Mock runtime/console output shown in the "Console" tab. */
  consoleOutput: string;
}

export const samples: SampleEntry[] = [
  {
    id: '01-kickstart',
    section: 1,
    title: 'Kickstart & Setup',
    subtitle: 'String vs string, primitives, implicit any',
    file: 'samples/01-kickstart-setup/tools-demo.ts',
    cheatSheet: `# 01 · Kickstart & Setup

## The \`String\` vs \`string\` trap

TypeScript exposes **two** things with similar names:

| Type        | Kind       | Runtime identity                          |
| ----------- | ---------- | ----------------------------------------- |
| \`string\`  | primitive  | a UTF-16 sequence, the only thing you want |
| \`String\`  | object     | the **boxed wrapper** \`new String('x')\`   |

\`String\` describes the *object* returned by \`new String(...)\`. It is an instance of the
\`String\` **constructor**, which lives on the prototype chain as \`String.prototype\`.
Assigning a primitive literal to a \`String\`-typed variable *type-checks* because a primitive
is structurally assignable to its boxed form, but at runtime the value is still a primitive —
the type **lies** about identity. \`typeof x === 'string'\` for primitives,
\`typeof x === 'object'\` for boxed objects.

## \`strict: true\` is a flag bundle

\`strict\` is an umbrella that flips ~8 flags at once. The most consequential:

- **\`strictNullChecks\`** — \`null\`/\`undefined\` stop being assignable to every type. This single
  flag eliminates an enormous class of runtime \`Cannot read property of null\` errors.
- **\`noImplicitAny\`** — untyped parameters become errors instead of silently becoming \`any\`.
- **\`strictFunctionTypes\`** — function params become *contravariant* (correct) instead of
  bivariant (the legacy method behavior).

## \`any\` vs \`unknown\`

\`any\` is an **opt-out** from the type system: the compiler stops checking that value entirely.
\`unknown\` is the type-safe top type — you can hold anything, but you **must narrow** before use.
Always prefer \`unknown\` at boundaries (parsed JSON, untrusted input).

## Type erasure

Annotations (\`: number\`, return types, generics) exist **only** in the type-checker. The
emitted JavaScript is pure ES — every annotation is stripped. That is why \`tsx\`/\`ts-node\`
can "run TypeScript": they transpile to JS and execute the JS. **Diagnostics never reach runtime.**`,
    consoleOutput: `[tsserver] Diagnostics: 5 errors
  tools-demo.ts:6   'String' wrapper type — consider 'string'.       (no error by default; flagged by lint)
  tools-demo.ts:13  Type 'null' is not assignable to type 'string'. (TS2322)
  tools-demo.ts:18  Parameter 'n' implicitly has an 'any' type.     (TS7006)
  tools-demo.ts:26  Property 'timestamp' does not exist ... 'any'.  (silently undefined at runtime)

$ tsx samples/01-kickstart-setup/tools-demo.ts
> runtime: payload.timestamp.iso  =>  TypeError: Cannot read properties of undefined (reading 'iso')
✖ process exited with code 1`,
  },
  {
    id: '02-build',
    section: 2,
    title: 'Build Process & Compile Targets',
    subtitle: 'emit vs type-check, target downleveling',
    file: 'samples/02-build-process/compile-targets.ts',
    cheatSheet: `# 02 · Build Process & Compile Targets

## \`target\` controls **emit**, \`lib\` controls **types**

- **\`target\`** = which JS syntax the compiler is allowed to *leave in the output*.
  \`target: ES2022\` means \`??\`, \`?.\`, top-level \`await\`, class fields are emitted verbatim.
  A lower target makes \`tsc\` **down-level** them (rewrite \`??\` into a ternary + helper).
- **\`lib\`** = which ambient type declarations (\`Array\`, \`Map\`, \`Promise\`, DOM) are in scope.
  You can have \`target: ES5\` with \`lib: ['ES2022']\` — you get modern types but ES5 emit.
  Mismatch them and you get "type exists but the runtime method does not".

## Default parameters & \`Function.prototype.length\`

A default-param does **not** make the parameter "present at runtime". \`fn.length\` counts
**required** (pre-default) parameters only. \`function f(a=1){}\` has \`.length === 0\`.
This is an ECMAScript spec rule, not a TypeScript quirk.

## \`null\` ≠ \`undefined\`

Under \`exactOptionalPropertyTypes: true\` an *omitted* optional property (\`prop?: T\`) is
distinct from \`prop: undefined\` and from \`prop: null\`. Passing \`null\` where the type only
allows \`T | undefined\` is now an error. Default-parameter fallback fires for \`undefined\`,
**never** for \`null\` (null is a real value).

## \`noImplicitReturns\`

Every code path of a function with a declared return type must explicitly \`return\`. A branch
that falls off the end implicitly returns \`undefined\`, which the flag forbids. Great for
catching a missing \`return\` in an \`if/else\` chain.

## Type erasure, revisited

When you run \`tsx file.ts\`, two things happen in sequence:
1. **Transpile** TS → JS (strip types, apply target transforms). No type-checking.
2. **Execute** the JS in Node.

That is why a file full of type errors can still *run* via \`tsx\` — type errors are advisory,
not blocking, unless you gate CI on \`tsc --noEmit\`.`,
    consoleOutput: `$ tsx samples/02-build-process/compile-targets.ts
greet.length           => 0   (not 1: default params excluded from .length)
retry(undefined)       => 3   (fallback used)
[diagnostic] TS2322: Type 'null' is not assignable to type 'number | undefined'.
[diagnostic] TS7030: Not all code paths return a value.
> TypeError: Cannot read properties of null at runtime if null slipped through`,
  },
  {
    id: '03-types',
    section: 3,
    title: 'Essential Types',
    subtitle: 'void vs undefined, covariance, excess props',
    file: 'samples/03-essential-types/function-covariance.ts',
    cheatSheet: `# 03 · Essential Types

## \`void\` is "return value will be ignored", not "returns nothing"

A callback typed \`() => void\` **accepts any return type**. This is a deliberate special case
so that \`.map(x => x * 2)\` type-checks even though \`Array#map\`'s callback returns \`T\`.
The reverse is **false**: a \`void\`-returning function is NOT assignable to a \`() => undefined\`
signature, because \`void\` does not guarantee the value is actually \`undefined\`.

## Fresh object literals vs variables (excess property checks)

Excess-property checking **only fires on the literal** at the assignment site. Assigning a
variable of a wider shape to a narrower type is fine **structurally** — the extra props are
silently allowed. This asymmetry exists because checking every assignment structurally would
break legitimate supertype-to-subtype flows. The literal check is the one place TS can be
"strict" without false positives.

## Function parameter variance

- **Method shorthand** (\`{ m(x: T) }\`) → checked **bivariantly** (lenient). Legacy, kept for
  array/subclass compatibility.
- **Property/arrow** (\`{ m: (x: T) => void }\`) → checked **contravariantly** (strict, correct).

Under \`strictFunctionTypes\` the property form enforces real subtype rules; the method form
does not. Prefer arrow-typed interfaces where safety matters.

## Tuples vs arrays

\`[string, number]\` is a *fixed-length positional* tuple, each slot independently typed.
\`(string | number)[]\` is a variadic array of the union. \`pair[0]\` is \`string\`; in a union
array every element is \`string | number\`. \`push\` on a tuple widens it to the union — a classic
gotcha fixed by \`readonly\` tuples.`,
    consoleOutput: `[diagnostic] TS2322: Type '() => void' is not assignable to '() => undefined'.
[diagnostic] TS2353: Object literal may only specify known properties — 'z' does not exist in type 'Point'.
[diagnostic] TS2322: Type '[number, string]' is not assignable to type '[string, number]'.
runtime: forEach returned number in a void slot — intentional, no error.`,
  },
  {
    id: '04-ide',
    section: 4,
    title: 'IDE Superpowers (tsserver)',
    subtitle: 'TSDoc hover, Map/Set enforcement, language service',
    file: 'samples/04-ide-superpowers/ts-server-demo.ts',
    cheatSheet: `# 04 · IDE Superpowers — the TypeScript Server (\`tsserver\`)

## Two binaries, one brain

- **\`tsc\`** = the batch compiler. Produces diagnostics + emit. Runs in CI.
- **\`tsserver\`** = the **language service**. Long-running process that powers VS Code's hover,
  go-to-definition, completions, quick-fixes, refactors. It reuses the same checker core but
  is incremental and caches the program graph across keystrokes.

## TSDoc → rich hover

JSDoc/TSDoc comments (\`/** ... */\`) are **metadata, not types**. The language service parses
them and renders \`@param\`/\`@returns\`/\`@throws\` as Markdown in hover. The *type signature*
(\`number => string\`) comes from the checker; the prose comes from the doc parser. They are
independent channels.

## \`Map<K, V>\` and \`Set<T>\` are generic over their element types

- \`Map.get(k)\` returns \`V | undefined\` — the key might not exist. Forgetting the \`undefined\`
  branch is the #1 Map bug. \`noUncheckedIndexedAccess\` brings the same discipline to arrays.
- \`Set\` uses **SameValueZero** equality. For primitives that is value equality; for **objects**
  it is **reference** identity. Two \`{ id: 1 }\` literals are distinct references → 2 entries.

## Symbol keys live in a separate slot

\`for...in\`, \`Object.keys\`, \`Object.entries\` enumerate **string-keyed** properties only.
Symbol-keyed properties live on a parallel internal slot and require
\`Object.getOwnPropertySymbols\` / \`Reflect.ownKeys\`. This is a spec-level separation, not a
TypeScript one.`,
    consoleOutput: `[diagnostic] TS2345: Argument of type '"out"' is not assignable to parameter of type 'number'.
[diagnostic] TS2532: Object is possibly 'undefined' (qty: number | undefined).
runtime: seen.size === 2          (reference equality, not structural)
runtime: Object.keys(obj) === ['a']   (symbol key invisible to Object.keys)`,
  },
  {
    id: '05-unions',
    section: 5,
    title: 'Unions & Narrowing',
    subtitle: 'discriminated unions, destructuring, never',
    file: 'samples/05-unions-narrowing/discriminated-traps.ts',
    cheatSheet: `# 05 · Unions & Narrowing

## Discriminated unions are narrowed via the **discriminant property**

A union is "discriminated" when every member has a literal-typed common field (\`kind\`,
\`type\`, \`tag\`). The checker performs **control-flow analysis** on that field: after
\`if (x.kind === 'circle')\` it collapses the union to the single matching member, so
\`x.radius\` is now known to exist.

## The destructuring trap

Narrowing works on the **original object**. The moment you do \`const { kind, radius } = x\`,
you have **severed the correlation**: \`kind\` and \`radius\` are now independent locals, and
checking \`kind\` no longer proves anything about \`radius\`'s presence. **Narrow first, read
second.** Never destructure a discriminated union across its members.

## \`typeof null === 'object'\` — the legendary bug

\`typeof\` returns \`'object'\` for \`null\` (a 1995 JavaScript mistake, frozen forever for
back-compat). So \`typeof x === 'object'\` does **not** exclude \`null\`. Use
\`x !== null\` or \`x == null\` (covers both null and undefined) instead.

## \`unknown\` forces narrowing

\`unknown\` is the type-safe top type. It has **no accessible members** until you narrow it
(\`typeof\`, \`instanceof\`, or a user-defined type guard / assertion function). It is the
correct type for untrusted input; \`any\` disables checking entirely.

## Exhaustiveness via \`never\`

After a complete \`switch\` over a discriminated union, the remaining value has type \`never\`
(it "cannot exist"). Assigning it to a \`never\`-typed parameter is a **compile-time
completeness check**: add a new union member and forget a case → that line errors. This is the
idiomatic way to make the compiler enforce exhaustive switches.`,
    consoleOutput: `[diagnostic] TS2339: Property 'radius' does not exist on type 'Shape' (destructuring broke narrowing).
[diagnostic] TS2531: Object is possibly 'null' (typeof null === 'object').
[diagnostic] TS2532: Object is of type 'unknown' — narrow before use.
runtime: areaOK({circle, r:2}) => 12.566...
exhaustiveness guard (assertNever) compiles clean while all members are handled.`,
  },
  {
    id: '06-mutability',
    section: 6,
    title: 'Objects & Mutability',
    subtitle: 'shallow readonly, as const, Omit/Pick traps',
    file: 'samples/06-objects-mutability/readonly-assertions.ts',
    cheatSheet: `# 06 · Objects & Mutability

## \`Readonly<T>\` is a **mapped type**, and mapped types do not recurse

\`type Readonly<T> = { readonly [P in keyof T]: T[P] }\`. It adds \`readonly\` to the **top**
level only. Nested objects remain mutable because \`T[P]\` is left untouched. For deep
immutability you need \`as const\` or a recursive \`DeepReadonly<T>\` type. This is the single
most common "why is my readonly not readonly?" question.

## \`as const\` does three things at once

1. Marks the entire tree **readonly** (deeply).
2. Widens nothing — every value becomes its **literal type** (\`'#000'\` not \`string\`, \`50\` not \`number\`).
3. Infers **tuples** for arrays instead of \`T[]\`.

The trap: literal types are extremely narrow. \`palette.primary\` is \`'#000'\`, not \`string\`,
so you cannot reassign any other string. \`as const\` is an assertion about *intent and shape*,
not just immutability. \`satisfies\` is the modern way to check shape **without** freezing the
inferred types.

## \`Omit\` / \`Pick\` traps

- **\`Omit<T, K>\` = \`{ [P in Exclude<keyof T, K>]: T[P] }\`** — it works on *declared keys*,
  so it cannot omit **index-signature** keys.
- **\`Omit\` does NOT distribute over unions.** \`Omit<A | B, 'tag'>\` first computes
  \`keyof (A | B)\` = the **common** keys, then omits — producing a merged blob, not per-member
  omissions. The fix is a **distributive** conditional: \`T extends unknown ? Omit<T, K> : never\`.

## \`const\` binding vs \`readonly\` type

- \`const x = {}\` freezes the **binding** — you cannot reassign \`x\`, but the object it points
  to is fully mutable.
- \`readonly\` freezes the **type** — you cannot mutate the property through that reference.

Two completely orthogonal axes. A \`const\` reference to a mutable object is still mutable in
place.`,
    consoleOutput: `[diagnostic] TS2540: Cannot assign to 'primary' because it is read-only (as const).
[diagnostic] TS2353: Excess property 'done' on Omit<Todo,'done'>.
[diagnostic] No error on s.nested.theme = 'light' — shallow Readonly<T> does not protect depth.
runtime: config.retries mutated to 99 — \`const\` only froze the binding.`,
  },
  {
    id: '07-classes',
    section: 7,
    title: 'TypeScript Classes',
    subtitle: 'access scope, super() order, parameter properties',
    file: 'samples/07-typescript-classes/inheritance-super.ts',
    cheatSheet: `# 07 · TypeScript Classes

## Access modifiers — scope cheat sheet

| Modifier     | inside class | subclass | outside |
| ------------ | :----------: | :------: | :-----: |
| \`public\`    |      ✅      |    ✅    |   ✅    |
| \`protected\` |      ✅      |    ✅    |   ❌    |
| \`private\`   |      ✅      |    ❌    |   ❌    |
| \`#field\`    |      ✅      |    ❌    |   ❌    |

## \`private\` is erased; \`#\` is real

\`private\` is a **compile-time-only** marker. The emitted JavaScript exposes the property as a
plain public field — it is *not* private at runtime, and \`JSON.stringify\` / reflection can see
it. \`#field\` is the **ECMAScript private field**: it survives transpilation (or is down-leveled
with a WeakMap) and is enforced by the **engine** via a per-instance private slot. Use \`#\` for
real encapsulation, \`private\` only as a documentation/type-safety hint.

## \`super()\` and the initialization order

In a derived class constructor, \`this\` does not exist until **after** \`super()\` returns.
Accessing \`this\` (or \`super.x\`) before \`super()\` throws \`ReferenceError: Must call super
constructor in derived class before accessing 'this' or returning from it\`. TypeScript enforces
this statically: you cannot reference \`this\` before the \`super()\` call. Parameter properties
(\`constructor(public x: number)\`) are sugar for "declare field + assign it" — the assignment
is emitted **right after** the implicit/explicit \`super()\`.

## Getters are implicitly readonly

A property with only a \`get\` accessor has no setter, so external code cannot write to it — it
is effectively readonly from the outside. A subclass still cannot *replace* it with a writable
field unless the base declares it overridable; this is where \`override\` (enforced by
\`noImplicitOverride\`) matters.

## \`this\`-type annotations

\`describe(this: Vehicle)\` binds the method's \`this\` to the class type. Calling it on a
subclass instance is fine (subtype), but calling it with an unrelated \`this\` is a type error.
This is how libraries express "this method must be called on an instance of X".`,
    consoleOutput: `[diagnostic] TS2445: Property 'wheels' is protected and only accessible within class 'Vehicle' and its subclasses.
[diagnostic] TS17009: 'this' is referenced before super() — if you tried it above super().
runtime: v.describe() => "vehicle #0.8732... with 2 wheels"
runtime: c.describe() => "vehicle #0.8732... with 2 wheels (car)"
note: \`private\` fields appear in the emitted JS; \`#\` fields do not.`,
  },
];

export type SamplesComponent = Component;
