# Design Patterns

## What a pattern actually is
A design pattern is a named, reusable solution shape to a recurring design
problem — not a library you import, and not specific code. Patterns are
usually grouped into three families (from the classic "Gang of Four"
catalog): **creational** (object creation), **structural** (composing
classes/objects into larger structures), and **behavioral** (how objects
communicate and distribute responsibility).

## A few high-yield patterns
- **Singleton** (creational) — ensures a class has exactly one instance
  and provides a global access point to it. Overused in student projects;
  it introduces global state and makes testing harder, so it's often
  better replaced with dependency injection.
- **Factory Method** (creational) — defines an interface for creating an
  object but lets subclasses decide which concrete class to instantiate.
- **Observer** (behavioral) — an object (subject) maintains a list of
  dependents (observers) and notifies them automatically of state
  changes. This is the pattern underneath most event/pub-sub systems and
  UI data-binding.
- **Strategy** (behavioral) — defines a family of interchangeable
  algorithms behind a common interface, letting the algorithm vary
  independently of the client using it.
- **Decorator** (structural) — attaches new behavior to an object
  dynamically by wrapping it, as an alternative to subclassing for every
  combination of features.
- **Adapter** (structural) — converts the interface of one class into an
  interface a client expects, letting incompatible interfaces work
  together.

## Common misconceptions worth correcting
- "Design patterns are language-specific tricks." They're
  language-agnostic design *ideas*; the exact implementation shape varies
  by language (some languages make certain patterns nearly invisible —
  e.g. first-class functions make a lot of "Strategy" implementations
  trivial).
- "Using more patterns = better design." Patterns solve *specific*
  recurring problems; forcing one in where the problem doesn't exist adds
  indirection and complexity for no benefit. This is sometimes mocked as
  "pattern soup."
- "MVC is a Gang-of-Four design pattern." MVC (Model-View-Controller) is
  an architectural pattern operating at a much larger scale than the
  classic GoF catalog, which focuses on class/object-level design.
