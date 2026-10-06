# UML (Unified Modeling Language)

## What UML is for
UML is a standardized set of diagram types for visualizing the design of a
software system, so a team can agree on structure and behavior before (or
while) writing code. It's a communication tool, not executable
specification — a UML diagram doesn't run, it describes.

## Structural vs. behavioral diagrams
- **Structural diagrams** show the static shape of the system: what
  exists and how the pieces relate. Main ones: **class diagrams**
  (classes, attributes, methods, relationships), **object diagrams**
  (snapshot of instances), **component diagrams**, **deployment
  diagrams**.
- **Behavioral diagrams** show how the system acts over time:
  **use case diagrams** (actors and what they can do with the system),
  **sequence diagrams** (message order between objects over time),
  **activity diagrams** (workflow/logic, similar to a flowchart), **state
  machine diagrams** (states an object moves through).

## Class diagram relationships, from loosest to tightest
1. **Dependency** (dashed arrow) — one class briefly uses another, e.g. as
   a method parameter.
2. **Association** (solid line) — a general structural link between
   classes that persists beyond a single method call.
3. **Aggregation** (hollow diamond) — a "whole-part" relationship where
   the part can exist independently of the whole (a `Team` has `Players`,
   but a `Player` can exist without that `Team`).
4. **Composition** (filled diamond) — a stronger whole-part relationship
   where the part's lifecycle depends on the whole (a `House` has `Rooms`;
   destroy the house, the rooms go with it).
5. **Generalization** (hollow triangle arrow) — the "is-a" / inheritance
   relationship.

## Common misconceptions worth correcting
- "A sequence diagram shows the whole system's architecture." It shows
  message flow for *one* scenario/interaction, over time, between a
  specific set of objects — it's not a structural overview.
- "Aggregation and composition are the same, just drawn differently."
  They differ specifically in ownership/lifecycle, not just notation —
  mixing them up is one of the most common UML grading mistakes.
- "A use case diagram documents *how* something works." It documents
  *what* the system does from a user's perspective (actors + goals), not
  internal logic — that's what activity or sequence diagrams are for.
