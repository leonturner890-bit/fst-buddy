# Object-Oriented Programming (OOP)

## The four pillars
- **Encapsulation** — bundling data and the methods that operate on it
  into one unit (a class/object), and hiding internal state behind a
  public interface so callers can't reach in and corrupt it directly.
- **Abstraction** — exposing only the essential behavior of an object and
  hiding the implementation details behind it. An interface or abstract
  class is abstraction in its purest form.
- **Inheritance** — a class (subclass) acquires the fields and methods of
  another class (superclass), letting you model "is-a" relationships and
  reuse behavior.
- **Polymorphism** — code written against a general type (a base class or
  interface) can work with any specific subtype, and the correct
  behavior is chosen at runtime (dynamic/"runtime" polymorphism via method
  overriding) or compile time (static polymorphism via method
  overloading).

## Classes vs. objects
A class is the blueprint; an object is a specific instance built from that
blueprint, with its own state. `Car` is a class; `myFirstCar` is an
object. This trips students up mostly around static members — a `static`
field belongs to the class itself, shared across every instance, not to
any one object.

## Composition vs. inheritance
Inheritance models "is-a" (`Dog is an Animal`); composition models "has-a"
(`Car has an Engine`). A very common and important piece of design advice
is "favor composition over inheritance" — deep inheritance hierarchies get
fragile and hard to change, while composing smaller objects together
tends to stay flexible. This is *not* the same as saying inheritance is
wrong; it's about not reaching for it as the default tool for every kind
of reuse.

## Common misconceptions worth correcting
- "Encapsulation just means making fields private." Making fields private
  is the mechanism; encapsulation is the goal of protecting invariants —
  you can still break encapsulation with public getters/setters that
  expose the same problem in a different shape.
- "Method overloading is polymorphism at runtime." Overloading is
  resolved at compile time based on argument types (static/compile-time
  polymorphism); overriding is what's resolved at runtime.
- "Abstract classes and interfaces are basically the same thing." In most
  languages an abstract class can hold state and partial implementation
  and a class can extend only one; an interface (traditionally) declares
  behavior only and a class can implement many.
