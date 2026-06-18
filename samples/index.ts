// ============================================================
// samples/index.ts — the presentation registry (docs-style).
//
// Each Section groups related concepts. Inside a section live
// several Snippets. A Snippet pairs a focused, comment-free
// piece of TypeScript code with its prose explanation. The UI
// renders each snippet as an inline, editable code box (Monaco)
// with a Play button + live TS diagnostics, just like VS Code.
//
// Section ordering follows the "Total TypeScript — TypeScript
// Pro Essentials" course video list (videos 001–194). Each
// section header notes the video range it maps to.
// ============================================================

export interface Snippet {
  /** Stable id, also used as the Monaco model URI so diagnostics are per-snippet. */
  id: string;
  /** Short heading shown above the code box. */
  title: string;
  /** Markdown prose explaining the concept / the trap. Shown outside the editor. */
  explanation: string;
  /** The focused TypeScript code (no big header comment blocks). */
  code: string;
  /** Mock console / runtime output revealed when the user clicks Play. */
  consoleOutput: string;
}

export interface Section {
  id: string;
  section: number;
  title: string;
  subtitle: string;
  /** Section-level markdown introduction. */
  intro: string;
  snippets: Snippet[];
}

export const sections: Section[] = [
  // ───────────────────────────────────────────────────────────
  {
    id: '01-setup-tooling',
    section: 1,
    title: 'Setup & Tooling',
    subtitle: 'Videos 001–021 · TS vs JS, build process, tsc, Vite, tsx',
    intro: `# 01 · Setup & Tooling

TypeScript is a **compile-time** layer over JavaScript: the type checker (\`tsc\`)
erases annotations to produce plain JS the browser/Node can run. \`target\` controls
what JS survives in the output, \`lib\` controls which ambient types are in scope.
Tooling choices — \`tsc\` watch, Vite, \`tsx\` — all share one truth: **types are
advisory, never blocking**. Each box below is editable.`,
    snippets: [
      {
        id: '01-types-erased-runtime',
        title: 'Types are erased at runtime (browsers run JS, not TS)',
        explanation: `Type annotations are **stripped** by the compiler — they exist only during
type-checking. The emitted JavaScript has no \`interface\`, no \`: T\`, no generics.
This is why browsers and Node can't "understand" \`.ts\` directly and why tools
like \`tsx\` transpile on the fly. It also means type errors **never** stop a
running program.`,
        code: `interface Product {
  id: number;
  name: string;
}

// At runtime this is plain JS — "Product" and the annotations are gone.
const mouse: Product = { id: 1, name: 'Mouse' };
console.log(mouse);`,
        consoleOutput: `{ id: 1, name: 'Mouse' }

// Emitted JS:   const mouse = { id: 1, name: "Mouse" };
// No interfaces, no type annotations survive the build.`,
      },
      {
        id: '01-target-vs-lib',
        title: 'target controls emit, lib controls types',
        explanation: `- **target** = which JS syntax the compiler leaves in the output. \`target: ES2022\`
  keeps \`??\`, \`?.\`, top-level \`await\` verbatim. A lower target **down-levels** them.
- **lib** = which ambient type declarations (\`Array\`, \`Map\`, \`Promise\`, DOM) are in scope.

You can have \`target: ES5\` with \`lib: ['ES2022']\` — modern types but ES5 emit.
Mismatch them and you get "type exists but the runtime method does not".`,
        code: `// \`??\` needs target >= ES2020 to emit verbatim. Below that it becomes
// a ternary + __helper. The TYPE is unaffected by target.
const maybe: number | null = null;
const value = maybe ?? 42;`,
        consoleOutput: `// target: ES2022  =>  emitted verbatim:  const value = maybe ?? 42;
// target: ES5      =>  down-leveled into a ternary helper.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '02-functions-basic-types',
    section: 2,
    title: 'Functions & Basic Types',
    subtitle: 'Videos 022–035 · params, basic types, optional & default params',
    intro: `# 02 · Functions & Basic Types

Functions are where the checker starts: every parameter needs an annotation
(\`noImplicitAny\`), \`strictNullChecks\` keeps \`null\`/\`undefined\` honest, and
default/optional parameters change both the type and the runtime signature
(\`Function.prototype.length\`).`,
    snippets: [
      {
        id: '02-string-vs-string',
        title: 'String (wrapper) vs string (primitive)',
        explanation: `TypeScript exposes **two** similarly-named things.

- \`string\` — the **primitive** type. This is what you want 99% of the time.
- \`String\` — the **boxed object** type returned by \`new String(...)\`.

A primitive literal *is* assignable to the boxed type (the type lies about
identity), so this type-checks — but at runtime the value stays a primitive.
Use the lowercase primitive. Always.`,
        code: `// Capital-S "String" is the boxed OBJECT type — almost never what you want.
const productName: String = 'Wireless Mouse';
const price: Number = 49.99;
const inStock: Boolean = true;

// Lowercase "string" is the primitive — the correct choice.
const ok: string = 'Wireless Mouse';`,
        consoleOutput: `// typeof productName => "string"  (primitive, despite the String type)
// The type annotation lied — runtime value is still a primitive.
// Rule of thumb: never annotate with Number / Boolean / Symbol / String.`,
      },
      {
        id: '02-implicit-any',
        title: 'Implicit any & noImplicitAny',
        explanation: `A parameter with no annotation becomes \`any\` implicitly.
\`noImplicitAny\` (implied by \`strict\`) turns that into an **error** instead of a
silent opt-out. Always annotate parameters.`,
        code: `// Parameter "n" has no annotation => implicitly any. Flagged under strict.
function format(n) {
  return n.toFixed(2); // TS7006: Parameter 'n' implicitly has an 'any' type.
}

// Correct: annotate it.
function formatOk(n: number) {
  return n.toFixed(2);
}`,
        consoleOutput: `[diagnostic] TS7006: Parameter 'n' implicitly has an 'any' type.`,
      },
      {
        id: '02-default-param-length',
        title: 'Default params & Function.prototype.length',
        explanation: `A default parameter does **not** count as a runtime argument for
\`.length\`. \`fn.length\` counts **required** (pre-default) parameters only.
\`function greet(name = 'guest'){}\` has \`.length === 0\`. This is an ECMAScript
spec rule, not a TypeScript quirk.`,
        code: `function greet(name = 'guest') {
  return \`Hello, \${name}\`;
}

console.log(greet.length); // 0, NOT 1 — default params are excluded.`,
        consoleOutput: `$ tsx ...
0`,
      },
      {
        id: '02-no-implicit-returns',
        title: 'noImplicitReturns catches missing returns',
        explanation: `Every code path of a function with a declared return type must
explicitly \`return\`. A branch that falls off the end implicitly returns
\`undefined\`, which \`noImplicitReturns\` forbids.`,
        code: `function classify(score: number): number | string {
  if (score > 50) {
    return 'pass';
  }
  // Missing return on the else branch — flagged.
}`,
        consoleOutput: `[diagnostic] TS7030: Not all code paths return a value.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '03-objects-arrays-tuples',
    section: 3,
    title: 'Objects, Arrays & Tuples',
    subtitle: 'Videos 036–049 · arrays of objects, rest params, tuples, any',
    intro: `# 03 · Objects, Arrays & Tuples

A single type alias becomes the **source of truth** for object shapes. Arrays of
objects are typed with \`T[]\`. Tuples pin a fixed length and per-slot types. And
\`any\` is the full opt-out — prefer \`unknown\` at boundaries.`,
    snippets: [
      {
        id: '03-tuples',
        title: 'Tuples vs arrays',
        explanation: `\`[string, number]\` is a *fixed-length positional* tuple — each slot is
independently typed. \`(string | number)[]\` is a variadic array of the union.
\`pair[0]\` is \`string\`; swapping positions is an error.`,
        code: `let pair: [string, number] = ['id', 7];
pair = [7, 'id']; // TS2322: position 0 must be string.`,
        consoleOutput: `[diagnostic] TS2322: Type '[number, string]' is not assignable to type '[string, number]'.`,
      },
      {
        id: '03-any-disables-checking',
        title: 'any disables the type checker',
        explanation: `\`any\` is a full **opt-out**: the compiler stops checking that value
entirely. It compiles, runs, and silently produces \`undefined\` at runtime.
Prefer \`unknown\` at boundaries (parsed JSON, untrusted input) — it forces you
to **narrow** before use.`,
        code: `const payload: any = 42;
// No error — but payload has no .timestamp. Runtime => undefined.
const createdAt = payload.timestamp.iso; // 💥 runtime TypeError`,
        consoleOutput: `> TypeError: Cannot read properties of undefined (reading 'iso')
✖ process exited with code 1

// Type annotations are ERASED at runtime — diagnostics never block execution.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '04-functions-sets-maps-async',
    section: 4,
    title: 'Function Types, Sets, Maps & Async',
    subtitle: 'Videos 050–061 · function types, Sets, Maps, JSON, fetch',
    intro: `# 04 · Function Types, Sets, Maps & Async

\`void\` is a special-case return type, \`Set\`/\`Map\` enforce their generics, and
\`async\` functions wrap results in \`Promise<T>\`. Parsed JSON arrives as \`any\`
(\`JSON.parse\` knows nothing) — type the boundary explicitly.`,
    snippets: [
      {
        id: '04-void-accepts-any-return',
        title: 'void = "return value will be ignored"',
        explanation: `A callback typed \`() => void\` **accepts any return type**. This is a
deliberate special case so \`.map(x => x * 2)\` type-checks even though
\`Array#map\`'s callback returns \`T\`. \`void\` does **not** mean "returns nothing".`,
        code: `const nums = [1, 2, 3];
// Returns a number, but assignable to (n) => void. Intended.
nums.forEach((n) => n * 2);`,
        consoleOutput: `// No error — a void-returning signature accepts any return type by design.`,
      },
      {
        id: '04-void-not-undefined',
        title: 'void is not assignable to () => undefined',
        explanation: `The reverse is **false**: a \`void\`-returning function is NOT
assignable to a \`() => undefined\` signature, because \`void\` does not guarantee
the value is actually \`undefined\`.`,
        code: `type Callback = () => undefined;
const cb: Callback = () => {}; // TS2322 — void-ish return is not undefined.`,
        consoleOutput: `[diagnostic] TS2322: Type '() => void' is not assignable to type '() => undefined'.`,
      },
      {
        id: '04-set-reference',
        title: 'Set uses reference equality for objects',
        explanation: `\`Set\` dedupes by **SameValueZero**. For primitives that is value
equality; for **objects** it is **reference** identity. Two identical-looking
object literals are distinct references → 2 entries.`,
        code: `const seen = new Set<{ id: number }>();
seen.add({ id: 1 });
seen.add({ id: 1 });
console.log(seen.size); // 2, NOT 1 — reference equality.`,
        consoleOutput: `2`,
      },
      {
        id: '04-map-types',
        title: 'Map<K, V> enforces its type params',
        explanation: `\`Map<K, V>\` enforces its type parameters on **every** operation.
Forgetting the \`V\` generic loses safety. And \`.get(k)\` returns \`V | undefined\` —
the key might not exist.`,
        code: `const stock = new Map<string, number>();
stock.set('mouse', 12);
stock.set('keyboard', 'out'); // TS2345: 'out' is not a number.

const qty = stock.get('mouse'); // number | undefined
const doubled: number = qty * 2; // TS2532: possibly undefined.`,
        consoleOutput: `[diagnostic] TS2345: Argument of type '"out"' is not assignable to parameter of type 'number'.
[diagnostic] TS2532: Object is possibly 'undefined'.`,
      },
      {
        id: '04-fetch-promise-typing',
        title: 'Typing a fetch response (async + Promise<T>)',
        explanation: `\`fetch().then(r => r.json())\` resolves to \`Promise<any>\` — \`JSON.parse\`
has no schema. Annotate the parsed shape at the boundary with a type assertion or
a decoder. Better: declare the async function's return type so the inference flows
outward instead of leaking \`any\`.`,
        code: `type User = { id: number; name: string };

async function loadUser(id: number): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  // json() is "any" — assert the shape at the boundary.
  return (await res.json()) as User;
}

// Caller gets a typed Promise<User>, not Promise<any>.
loadUser(1).then((u) => u.name);`,
        consoleOutput: `// loadUser(id) : Promise<User>   ← declared return type drives the inference.
// Without it, .json() would silently produce any and u.name would be untyped.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '05-ide-superpowers',
    section: 5,
    title: 'IDE Superpowers (tsserver)',
    subtitle: 'Videos 062–080 · hover, autocomplete, go-to-def, organize imports',
    intro: `# 05 · IDE Superpowers — the TypeScript Server

\`tsserver\` is the **language service** that powers VS Code hover, go-to-definition,
completions and quick-fixes. It reuses the same checker core as \`tsc\` but is
incremental and cached across keystrokes.`,
    snippets: [
      {
        id: '05-tsdoc',
        title: 'TSDoc → rich hover (metadata, not types)',
        explanation: `JSDoc/TSDoc comments (\`/** ... */\`) are **metadata, not types**. The
language service parses them and renders \`@param\` / \`@returns\` / \`@throws\` as
Markdown in hover. The *type signature* comes from the checker; the prose comes
from the doc parser. Independent channels.`,
        code: `/**
 * Formats a price for display.
 * @param cents - amount in integer cents (1299 => "$12.99")
 * @returns a localized currency string
 * @throws when cents is negative
 */
export function formatPrice(cents: number): string {
  if (cents < 0) throw new Error('negative');
  return (cents / 100).toFixed(2);
}`,
        consoleOutput: `// Hover "formatPrice" in VS Code: the TSDoc renders as Markdown beside the type.`,
      },
      {
        id: '05-symbol-keys',
        title: 'Symbol keys are invisible to Object.keys',
        explanation: `\`for...in\`, \`Object.keys\`, \`Object.entries\` enumerate
**string-keyed** properties only. Symbol-keyed properties live on a parallel
internal slot and require \`Object.getOwnPropertySymbols\` / \`Reflect.ownKeys\`.
This is essential to know when hovering/introspecting an object in the IDE.`,
        code: `const SECRET = Symbol('secret');
const obj: Record<string, number> & Record<typeof SECRET, number> = {
  a: 1,
  [SECRET]: 99,
};
console.log(Object.keys(obj)); // ['a'] — symbol key invisible.`,
        consoleOutput: `[ 'a' ]`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '06-unions-narrowing',
    section: 6,
    title: 'Unions & Narrowing',
    subtitle: 'Videos 081–100 · null, unions, literal types, typeof / in narrowing',
    intro: `# 06 · Unions & Narrowing

Control-flow analysis collapses unions when you narrow on a discriminant. \`typeof\`,
\`in\`, truthiness and equality guards all narrow — but \`typeof null === 'object'\`
(the legendary 1995 bug) still catches people, and \`strictNullChecks\` keeps \`null\`
out of plain types.`,
    snippets: [
      {
        id: '06-null-not-string',
        title: 'null is not a string (strictNullChecks)',
        explanation: `Under \`strict: true\`, \`strictNullChecks\` is enabled: \`null\` and
\`undefined\` are **no longer assignable to every type**. This single flag
eliminates a huge class of \`Cannot read property of null\` runtime errors.`,
        code: `// strictNullChecks: null is NOT assignable to string.
let label: string = null; // TS2322

// Correct: model absence explicitly.
let labelOrMissing: string | null = null;`,
        consoleOutput: `[diagnostic] TS2322: Type 'null' is not assignable to type 'string'.`,
      },
      {
        id: '06-null-vs-undefined',
        title: 'null ≠ undefined',
        explanation: `Under \`exactOptionalPropertyTypes: true\`, an *omitted* optional
property (\`prop?: T\`) is distinct from \`prop: undefined\` and from \`prop: null\`.
A default-parameter fallback fires for \`undefined\`, **never** for \`null\` (null
is a real value).`,
        code: `type User = { id: number; nickname?: string };

// exactOptionalPropertyTypes: null is not assignable to string | undefined.
const u: User = { id: 1, nickname: null }; // TS2322

function retry(attempts = 3) {
  return attempts;
}
retry(undefined); // => 3 (fallback used)
retry(null);      // TS2322: null is not assignable to number`,
        consoleOutput: `retry(undefined) => 3   (fallback used)
[diagnostic] TS2322: Type 'null' is not assignable to type 'number | undefined'.`,
      },
      {
        id: '06-typeof-null',
        title: 'typeof null === "object" — the legendary bug',
        explanation: `\`typeof\` returns \`'object'\` for \`null\` (a 1995 mistake frozen
forever for back-compat). So \`typeof x === 'object'\` does **not** exclude \`null\`.
Use \`x !== null\` or \`x == null\` (covers both null and undefined).`,
        code: `function labelOf(x: string | null) {
  if (typeof x === 'object') {
    return x.length; // x is STILL null here — runtime throws.
  }
  return x;
}`,
        consoleOutput: `[diagnostic] TS18047: 'x' is possibly 'null'.
> TypeError: Cannot read properties of null (reading 'length')`,
      },
      {
        id: '06-typeof-in-narrowing',
        title: 'typeof & in guards narrow unions',
        explanation: `\`typeof\` narrows primitives; \`in\` narrows by property presence. After
the guard the union collapses to the matched member, so the field is known to exist.
Order matters: always guard **before** you read a member that only some members have.`,
        code: `type Input = string | string[] | { query: string };

function first(i: Input): string {
  if (typeof i === 'string') return i;       // narrowed to string
  if ('query' in i) return i.query;          // narrowed to { query: string }
  return i[0] ?? '';                          // narrowed to string[]
}`,
        consoleOutput: `// Each branch sees only the narrowed member of the Input union.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '07-unknown-never',
    section: 7,
    title: 'unknown & never',
    subtitle: 'Videos 101–112 · unknown, never, return-type & scope narrowing',
    intro: `# 07 · unknown & never

\`unknown\` is the type-safe counterpart of \`any\`: you **must** narrow before use.
\`never\` is the bottom type — the value that can never exist — and powers
exhaustiveness checking across scopes.`,
    snippets: [
      {
        id: '07-unknown-narrowing',
        title: 'unknown forces narrowing before use',
        explanation: `Unlike \`any\`, \`unknown\` cannot be read until you narrow it. This makes it
the correct type for \`JSON.parse\`, caught errors, and any untrusted boundary.
Narrow with \`typeof\` / \`in\` / a type guard, or validate with a runtime decoder.`,
        code: `function handle(raw: unknown) {
  // raw.id  // TS2571 — can't access members of unknown.
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    return raw.id; // narrowed — now accessible.
  }
  return null;
}`,
        consoleOutput: `[diagnostic] TS2571: Object is of type 'unknown'.  (before the guard)
// After narrowing, raw.id is typed — safe to read.`,
      },
      {
        id: '07-exhaustiveness-never',
        title: 'Exhaustiveness via never',
        explanation: `After a complete \`switch\` over a discriminated union, the remaining
value has type \`never\`. Assigning it to a \`never\`-typed parameter is a
**compile-time completeness check**: add a new union member and forget a case →
that line errors.`,
        code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };

function assertNever(x: never): never {
  throw new Error(\`Unhandled: \${JSON.stringify(x)}\`);
}
function describe(shape: Shape): string {
  switch (shape.kind) {
    case 'circle':
      return 'circle';
    case 'square':
      return 'square';
    default:
      return assertNever(shape); // errors if a new member is added & unhandled
  }
}`,
        consoleOutput: `// Compiles clean while every member is handled. Add { kind: 'triangle' } and
// the default branch stops being \`never\` — compile error. Brilliant.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '08-discriminated-unions',
    section: 8,
    title: 'Discriminated Unions',
    subtitle: 'Videos 113–125 · discriminants, switch, destructuring traps',
    intro: `# 08 · Discriminated Unions

A union is "discriminated" when every member shares a literal-typed field
(\`kind\`). After \`switch (x.kind)\` the checker collapses the union to the single
matching member. The trap: destructuring severs that correlation.`,
    snippets: [
      {
        id: '08-disciminant',
        title: 'Narrowing on the discriminant property',
        explanation: `After \`switch (shape.kind)\` the checker collapses the union to
the single matching member, so \`shape.radius\` is known to exist.`,
        code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; w: number; h: number };

function areaOK(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius * shape.radius;
    case 'square':
      return shape.size * shape.size;
    case 'rect':
      return shape.w * shape.h;
  }
}`,
        consoleOutput: `// Clean — narrowing on shape.kind exposes the right fields per branch.`,
      },
      {
        id: '08-destructuring-trap',
        title: 'The destructuring trap',
        explanation: `Narrowing works on the **original object**. The moment you do
\`const { kind, radius } = shape\`, you have **severed the correlation**: checking
\`kind\` no longer proves anything about \`radius\`'s presence. **Narrow first, read
second** — never destructure a discriminated union across its members.`,
        code: `function areaBAD(shape: Shape) {
  const { kind, radius, size, w, h } = shape; // severs the link
  if (kind === 'circle') return Math.PI * radius * radius; // radius: number | undefined
  return 0;
}`,
        consoleOutput: `[diagnostic] TS2339: Property 'radius' does not exist on type 'Shape'.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '09-extend-interfaces-records',
    section: 9,
    title: 'Extending Types & Interfaces',
    subtitle: 'Videos 126–141 · intersections, interface extends, records, dynamic keys',
    intro: `# 09 · Extending Types & Interfaces

Composition comes in two flavors: the \`&\` **intersection** operator (on type
aliases) and the \`extends\` clause (on interfaces). \`Record<K, V>\` and index
signatures model dynamic keys. Method-shorthand members are checked leniently
(bivariant), arrow-typed members are checked strictly.`,
    snippets: [
      {
        id: '09-intersection-vs-extends',
        title: 'Intersection (&) vs interface extends',
        explanation: `- **Intersection** (\`A & B\`) composes *any* types and merges structurally —
  even conflicting property types (which can produce \`never\`).
- **interface X extends Y** only works on object interfaces, errors on conflicting
  members, and enables declaration merging.

Use intersections for ad-hoc composition; use \`extends\` for explicit hierarchies.`,
        code: `type WithId = { id: number };
type Named = { name: string };

// Intersection: composes any object types.
type User = WithId & Named;

interface Animal {
  legs: number;
}
// Interface extends: explicit hierarchy, errors on conflicts.
interface Dog extends Animal {
  bark(): void;
}`,
        consoleOutput: `// User = { id: number; name: string }
// Dog = { legs: number; bark(): void }`,
      },
      {
        id: '09-bivariance',
        title: 'Method (bivariant) vs arrow (contravariant)',
        explanation: `- **Method shorthand** (\`{ m(x: T) }\`) → checked **bivariantly** (lenient). Legacy.
- **Property/arrow** (\`{ m: (x: T) => void }\`) → checked **contravariantly** (strict, correct).

Under \`strictFunctionTypes\` the property form enforces real subtype rules; the
method form does not. Prefer arrow-typed interfaces where safety matters.`,
        code: `interface Speaker {
  say(text: string): void; // method => bivariant (lenient)
}
const loud: Speaker = {
  say(text: string | number) {
    console.log(text);
  },
};`,
        consoleOutput: `// No error: the method shorthand allows the wider string | number parameter.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '10-utility-types',
    section: 10,
    title: 'Utility Types',
    subtitle: 'Videos 142–154 · declaration merging, Pick, Omit, Partial, Required',
    intro: `# 10 · Utility Types

\`Partial\`, \`Pick\`, \`Omit\`, \`Required\` derive new shapes from existing ones —
ideal for update payloads and previews. \`Omit\`/\`Pick\` are **distributive** over
unions, and excess-property checks only fire on fresh literals.`,
    snippets: [
      {
        id: '10-excess-props',
        title: 'Excess property checks fire only on literals',
        explanation: `Excess-property checking **only fires on the literal** at the assignment
site. Assigning a variable of a wider shape to a narrower type is fine
**structurally** — the extra props are silently allowed.`,
        code: `type Point = { x: number; y: number };

const raw = { x: 1, y: 2, z: 3 };
const p1: Point = raw; // OK — no excess check on variables.

const p2: Point = { x: 1, y: 2, z: 3 }; // TS2353: 'z' does not exist on Point.`,
        consoleOutput: `[diagnostic] TS2353: Object literal may only specify known properties, and 'z' does not exist in type 'Point'.`,
      },
      {
        id: '10-omit-traps',
        title: 'Omit works on declared keys only',
        explanation: `\`Omit<T, K> = { [P in Exclude<keyof T, K>]: T[P] }\` operates on
*declared keys*. So an \`Omit<Todo, 'done'>\` type still rejects an object that
includes \`done\` only when assigned as a literal. (Distributive \`Omit\` over unions
is a separate trap — see below.)`,
        code: `type Todo = { id: number; title: string; done: boolean };
type TodoPreview = Omit<Todo, 'done'>;
const t: TodoPreview = { id: 1, title: 'x', done: false }; // TS2353: excess 'done'.`,
        consoleOutput: `[diagnostic] TS2353: Object literal may only specify known properties, and 'done' does not exist in type 'TodoPreview'.`,
      },
      {
        id: '10-pick-partial',
        title: 'Pick & Partial derive update shapes',
        explanation: `\`Pick<T, K>\` keeps only selected keys — perfect for a "preview" view.
\`Partial<T>\` marks every property optional — the canonical type for a PATCH/update
payload where the caller may send any subset.`,
        code: `type Todo = { id: number; title: string; done: boolean };

type TodoPreview = Pick<Todo, 'id' | 'title'>; // { id; title }
type TodoUpdate = Partial<Omit<Todo, 'id'>>;   // { title?; done? }

function patch(id: number, data: TodoUpdate) {
  /* ... */
}`,
        consoleOutput: `// TodoPreview = { id: number; title: string }
// TodoUpdate  = { title?: string; done?: boolean }`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '11-inference-readonly',
    section: 11,
    title: 'Inference & Readonly',
    subtitle: 'Videos 155–172 · inference, Readonly, as const, freeze, readonly tuples',
    intro: `# 11 · Inference & Readonly

\`Readonly<T>\` is **shallow**. \`as const\` does three things at once (deep
readonly + literal types + tuples). And \`const x = {}\` freezes the binding, not
the value — two orthogonal axes.`,
    snippets: [
      {
        id: '11-shallow-readonly',
        title: 'Readonly<T> is shallow',
        explanation: `\`type Readonly<T> = { readonly [P in keyof T]: T[P] }\` adds
\`readonly\` to the **top level only**. Nested objects remain mutable because
\`T[P]\` is left untouched. For deep immutability use \`as const\` or a recursive
\`DeepReadonly<T>\`.`,
        code: `type Settings = Readonly<{ nested: { theme: string } }>;
const s: Settings = { nested: { theme: 'dark' } };
s.nested.theme = 'light'; // No error — shallow readonly does not protect depth.`,
        consoleOutput: `// No diagnostic. s.nested is still a mutable { theme: string }.`,
      },
      {
        id: '11-as-const',
        title: 'as const does three things at once',
        explanation: `1. Marks the whole tree **readonly** (deeply).
2. Widens nothing — every value becomes its **literal type** (\`'#000'\` not \`string\`).
3. Infers **tuples** for arrays instead of \`T[]\`.

The trap: literal types are extremely narrow, so you cannot reassign another
string. \`satisfies\` is the modern way to check shape **without** freezing types.`,
        code: `const palette = {
  primary: '#000',
  shades: [50, 100, 200],
} as const;
palette.primary = '#fff'; // TS2540: readonly.
const shade: number = palette.shades[0]; // type is literal 50, very narrow.`,
        consoleOutput: `[diagnostic] TS2540: Cannot assign to 'primary' because it is a read-only property.`,
      },
      {
        id: '11-const-vs-readonly',
        title: 'const binding ≠ readonly type',
        explanation: `- \`const x = {}\` freezes the **binding** — you cannot reassign \`x\`, but the
  object it points to is fully mutable.
- \`readonly\` freezes the **type** — you cannot mutate the property through that reference.

Two orthogonal axes. A \`const\` reference to a mutable object is still mutable
in place.`,
        code: `const config = { retries: 3 };
config.retries = 99; // legal — const only froze the binding, not the value.`,
        consoleOutput: `// No diagnostic. config.retries is now 99.`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '12-classes',
    section: 12,
    title: 'TypeScript Classes',
    subtitle: 'Videos 173–194 · access scope, constructors, getters/setters, extends, interfaces',
    intro: `# 12 · TypeScript Classes

\`private\` is erased at runtime; \`#field\` is real. \`super()\` must run before
\`this\` exists. A getter with no setter is effectively readonly from the outside,
and \`override\` makes the compiler catch stale overrides.`,
    snippets: [
      {
        id: '12-access-scope',
        title: 'Access modifier scope',
        explanation: `| Modifier | inside class | subclass | outside |
| --- | :---: | :---: | :---: |
| public | ✅ | ✅ | ✅ |
| protected | ✅ | ✅ | ❌ |
| private | ✅ | ❌ | ❌ |
| #field | ✅ | ❌ | ❌ | (runtime-enforced)

\`protected\` members are accessible in a subclass body, but NOT from an external
caller.`,
        code: `class Vehicle {
  #internalId = Math.random();
  protected readonly wheels: number;
  constructor(wheels: number) {
    this.wheels = wheels;
  }
}
const v = new Vehicle(2);
console.log(v.wheels); // TS2445: protected — not accessible outside.`,
        consoleOutput: `[diagnostic] TS2445: Property 'wheels' is protected and only accessible within class 'Vehicle' and its subclasses.`,
      },
      {
        id: '12-private-vs-hash',
        title: 'private is erased; # is real',
        explanation: `\`private\` is a **compile-time-only** marker — the emitted JS
exposes the property publicly; \`JSON.stringify\` / reflection can see it. \`#field\`
is the **ECMAScript private field**: it survives and is enforced by the **engine**
via a per-instance private slot.`,
        code: `class Account {
  private pin: number;     // erased at runtime — public in emitted JS
  #token: string;          // truly private — enforced by the engine
  constructor(pin: number, token: string) {
    this.pin = pin;
    this.#token = token;
  }
}`,
        consoleOutput: `// Emitted JS exposes "pin" as a normal field; "#token" is kept private.`,
      },
      {
        id: '12-super-order',
        title: 'super() before this',
        explanation: `In a derived class constructor, \`this\` does not exist until **after**
\`super()\` returns. Accessing \`this\` before \`super()\` throws at runtime.
TypeScript enforces this statically.`,
        code: `class Car extends Vehicle {
  public model: string;
  constructor(model: string) {
    // this.model = model; // HERE => runtime ReferenceError
    super(4);
    this.model = model;
  }
}`,
        consoleOutput: `// Correct order: super() first, then assign instance fields.`,
      },
      {
        id: '12-getter-readonly',
        title: 'A getter with no setter is readonly',
        explanation: `A property with only a \`get\` accessor has no setter, so external code
cannot write to it — it is effectively readonly from the outside. A subclass
cannot replace it with a writable field unless the base declares it overridable
(\`noImplicitOverride\` enforces the \`override\` keyword).`,
        code: `class Vehicle {
  protected wheels: number;
  constructor(wheels: number) {
    this.wheels = wheels;
  }
  get wheelCount(): number {
    return this.wheels;
  }
  describe(this: Vehicle): string {
    return \`vehicle with \${this.wheels} wheels\`;
  }
}`,
        consoleOutput: `// wheelCount is read-only from the outside (no setter).`,
      },
    ],
  },
];
