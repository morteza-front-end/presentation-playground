// ============================================================
// 07 — TYPESCRIPT CLASSES
// File: inheritance-super.ts
// Theme: access modifier scope (inside / child / outside),
//        super() initialization order, parameter properties,
//        implicit readonly getters.
// ============================================================

class Vehicle {
  // `#` is the runtime-private ECMAScript field (truly private, enforced by the engine).
  // `private` is a COMPILE-TIME-only marker — erased at runtime, fully public in emitted JS.
  #internalId = Math.random();
  protected readonly wheels: number;

  constructor(wheels: number) {
    this.wheels = wheels;
  }

  // A getter with no setter is effectively readonly from the outside.
  // The trap: subclasses CANNOT override a `readonly` property with a setter.
  get wheelCount(): number {
    return this.wheels;
  }

  describe(this: Vehicle): string {
    return `vehicle #${this.#internalId} with ${this.wheels} wheels`;
  }
}

class Car extends Vehicle {
  public model: string;

  // BUG #1 — `super()` MUST be called before accessing `this` in a derived constructor.
  // Before super() runs, `this` is in the "uninitialized" TDZ-like state — accessing it throws.
  constructor(model: string) {
    // `this.model = model;` HERE would throw at runtime: "Must call super first".
    super(4);
    this.model = model;
  }

  // BUG #2 — Parameter properties (`constructor(public x: number)`) are sugar that
  // auto-declares AND assigns the field. Mixing parameter-props with explicit body
  // assignment is legal but confusing; the field is assigned in emit order.
  static create(color: string) {
    // BUG #3 — `protected` member `wheels` is accessible in a subclass body,
    // but NOT from an external caller (outside the class hierarchy).
    return color;
  }

  describe(): string {
    // BUG #4 — overriding a method: you can call super.describe() but it expects
    // a `this` bound to Vehicle's shape. The `this: Vehicle` annotation in the base
    // means calling `vehicleInstance.describe.call(carInstance)` is type-checked.
    return `${super.describe()} (car)`;
  }
}

// BUG #5 — Access modifier scope cheat-sheet the audience must memorize:
//   public    => inside / child / outside   — everywhere
//   protected => inside / child              — NOT outside
//   private   => inside only                 — not even subclasses
//   #field    => inside only, RUNTIME-enforced (not just compile-time)
//
// `private` is ERASED: the emitted JS exposes the property publicly. `#` survives emit
// and is enforced by the V8 engine via a per-instance private slot.

const v = new Vehicle(2);
const c = new Car('Sedan');

console.log(v.describe(), c.describe());
console.log(v.wheels); // BUG: `wheels` is protected — not accessible outside.
