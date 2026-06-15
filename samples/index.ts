// ============================================================
// samples/index.ts — the presentation registry (docs-style).
//
// Each Section groups related concepts. Inside a section live
// several Snippets. A Snippet pairs a focused, comment-free
// piece of TypeScript code with its prose explanation. The UI
// renders each snippet as an inline, editable code box (Monaco)
// with a Play button + live TS diagnostics, just like VS Code.
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
    id: '01-kickstart',
    section: 1,
    title: 'Kickstart & Setup',
    subtitle: 'String vs string, primitives, implicit any',
    intro: `# 01 · Kickstart & Setup

The foundations: how TypeScript annotates values, what \`strict: true\` actually
flips on, and why \`any\` is an escape hatch you should rarely use. Each box below
is **editable** — change the code and watch the red squiggles update live.`,
    snippets: [
      {
        id: '01-string-vs-string',
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
        id: '01-null-not-string',
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
        id: '01-implicit-any',
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
        id: '01-any-disables-checking',
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
    id: '02-build',
    section: 2,
    title: 'Build Process & Compile Targets',
    subtitle: 'emit vs type-check, target downleveling',
    intro: `# 02 · Build Process & Compile Targets

\`target\` controls **emit** (which JS syntax survives in the output); \`lib\`
controls **types** (which ambient declarations are in scope). They are independent.
This is also where \`tsx\`/"running TypeScript" becomes clear: it **transpiles**
types away and executes the JS — type errors are advisory, never blocking.`,
    snippets: [
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
        id: '02-null-vs-undefined',
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
        id: '02-target-vs-lib',
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
    id: '03-types',
    section: 3,
    title: 'Essential Types',
    subtitle: 'void vs undefined, covariance, excess props',
    intro: `# 03 · Essential Types

The subtle rules: what \`void\` really promises, why fresh object literals are
checked but variables are not, and the difference between bivariant (method)
and contravariant (arrow) parameter checking.`,
    snippets: [
      {
        id: '03-void-accepts-any-return',
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
        id: '03-void-not-undefined',
        title: 'void is not assignable to () => undefined',
        explanation: `The reverse is **false**: a \`void\`-returning function is NOT
assignable to a \`() => undefined\` signature, because \`void\` does not guarantee
the value is actually \`undefined\`.`,
        code: `type Callback = () => undefined;
const cb: Callback = () => {}; // TS2322 — void-ish return is not undefined.`,
        consoleOutput: `[diagnostic] TS2322: Type '() => void' is not assignable to type '() => undefined'.`,
      },
      {
        id: '03-excess-props',
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
        id: '03-bivariance',
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
    ],
  },

  // ───────────────────────────────────────────────────────────
  {
    id: '04-ide',
    section: 4,
    title: 'IDE Superpowers (tsserver)',
    subtitle: 'TSDoc hover, Map/Set enforcement, language service',
    intro: `# 04 · IDE Superpowers — the TypeScript Server

\`tsserver\` is the **language service** that powers VS Code hover, go-to-definition,
completions and quick-fixes. It reuses the same checker core as \`tsc\` but is
incremental and cached across keystrokes.`,
    snippets: [
      {
        id: '04-tsdoc',
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
        id: '04-symbol-keys',
        title: 'Symbol keys are invisible to Object.keys',
        explanation: `for...in\`, \`Object.keys\`, \`Object.entries\` enumerate
**string-keyed** properties only. Symbol-keyed properties live on a parallel
internal slot and require \`Object.getOwnPropertySymbols\` / \`Reflect.ownKeys\`.`,
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
    id: '05-unions',
    section: 5,
    title: 'Unions & Narrowing',
    subtitle: 'discriminated unions, destructuring, never',
    intro: `# 05 · Unions & Narrowing

Control-flow analysis collapses unions when you narrow on a discriminant. But
the moment you destructure, you sever the correlation. And \`typeof null === 'object'\`
— the legendary bug — still catches people.`,
    snippets: [
      {
        id: '05-disciminant',
        title: 'Narrowing on the discriminant property',
        explanation: `A union is "discriminated" when every member shares a literal-typed
field (\`kind\`). After \`switch (shape.kind)\` the checker collapses the union to
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
        id: '05-destructuring-trap',
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
      {
        id: '05-typeof-null',
        title: 'typeof null === "object" — the legendary bug',
        explanation: `typeof\` returns \`'object'\` for \`null\` (a 1995 mistake frozen
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
        id: '05-exhaustiveness-never',
        title: 'Exhaustiveness via never',
        explanation: `After a complete \`switch\` over a discriminated union, the remaining
value has type \`never\`. Assigning it to a \`never\`-typed parameter is a
**compile-time completeness check**: add a new union member and forget a case →
that line errors.`,
        code: `function assertNever(x: never): never {
  throw new Error(\`Unhandled: \${JSON.stringify(x)}\`);
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
    id: '06-mutability',
    section: 6,
    title: 'Objects & Mutability',
    subtitle: 'shallow readonly, as const, Omit/Pick traps',
    intro: `# 06 · Objects & Mutability

\`Readonly<T>\` is shallow. \`as const\` does three things at once. \`Omit\` does
not distribute over unions. These are the most common "why isn't this readonly?"
questions.`,
    snippets: [
      {
        id: '06-shallow-readonly',
        title: 'Readonly<T> is shallow',
        explanation: `type Readonly<T> = { readonly [P in keyof T]: T[P] }\` adds
\`readonly\` to the **top level only**. Nested objects remain mutable because
\`T[P]\` is left untouched. For deep immutability use \`as const\` or a recursive
\`DeepReadonly<T>\`.`,
        code: `type Settings = Readonly<{ nested: { theme: string } }>;
const s: Settings = { nested: { theme: 'dark' } };
s.nested.theme = 'light'; // No error — shallow readonly does not protect depth.`,
        consoleOutput: `// No diagnostic. s.nested is still a mutable { theme: string }.`,
      },
      {
        id: '06-as-const',
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
        id: '06-omit-traps',
        title: 'Omit works on declared keys only',
        explanation: `Omit<T, K> = { [P in Exclude<keyof T, K>]: T[P] }\` operates on
*declared keys*. So an \`Omit<Todo, 'done'>\` type still rejects an object that
includes \`done\` only when assigned as a literal. (Distributive \`Omit\` over unions
is a separate trap — see below.)`,
        code: `type Todo = { id: number; title: string; done: boolean };
type TodoPreview = Omit<Todo, 'done'>;
const t: TodoPreview = { id: 1, title: 'x', done: false }; // TS2353: excess 'done'.`,
        consoleOutput: `[diagnostic] TS2353: Object literal may only specify known properties, and 'done' does not exist in type 'TodoPreview'.`,
      },
      {
        id: '06-const-vs-readonly',
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
    id: '07-classes',
    section: 7,
    title: 'TypeScript Classes',
    subtitle: 'access scope, super() order, parameter properties',
    intro: `# 07 · TypeScript Classes

\`private\` is erased at runtime; \`#field\` is real. \`super()\` must run before
\`this\` exists. \`override\` makes the compiler catch stale overrides.`,
    snippets: [
      {
        id: '07-access-scope',
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
        id: '07-private-vs-hash',
        title: 'private is erased; # is real',
        explanation: `private\` is a **compile-time-only** marker — the emitted JS
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
        id: '07-super-order',
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
        id: '07-getter-readonly',
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
