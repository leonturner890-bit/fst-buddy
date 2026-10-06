# Software Development Life Cycle (SDLC)

## What SDLC is
The SDLC is the sequence of stages a piece of software moves through from
first idea to retirement: requirements, design, implementation, testing,
deployment, and maintenance. It exists to make software work predictable
and repeatable rather than ad hoc — every methodology (Waterfall, Agile,
Spiral, V-Model) is really just a different way of arranging these same
stages.

## The core stages
1. **Requirements gathering & analysis** — figure out what the system must
   do, for whom, and under what constraints. Output: functional and
   non-functional requirements.
2. **Design** — turn requirements into a technical plan: architecture,
   data models, interfaces, chosen technologies. Output: design documents,
   often including UML diagrams.
3. **Implementation (coding)** — write the actual code against the design.
4. **Testing** — verify the system does what it's supposed to and doesn't
   do what it isn't. Includes unit, integration, system, and acceptance
   testing.
5. **Deployment** — release the system into its real operating
   environment.
6. **Maintenance** — fix bugs, patch security issues, and extend the
   system after release. This is usually the longest and most expensive
   phase of a system's life.

## Waterfall vs. iterative models
Waterfall runs the stages once, in strict sequence, with a hard hand-off
between each — cheap to plan, expensive to change your mind. Iterative
models (Agile, Spiral, RUP) repeat a compressed version of the whole cycle
many times over short periods, trading some up-front predictability for
the ability to course-correct as you learn. A common student mix-up:
Waterfall is a *model of stages*, Agile is a *philosophy about how to move
through them* — they aren't strictly opposites, and you can (rarely) run
Agile ceremonies inside a Waterfall-shaped project plan.

## Common misconceptions worth correcting
- "SDLC is a methodology." It's not — it's the underlying set of phases;
  Agile, Waterfall, and Scrum are methodologies that implement the SDLC
  differently.
- "Testing is a phase that happens after coding." True in Waterfall, false
  in most modern practice — with TDD or continuous testing, tests are
  written before or alongside the code they check.
- "Maintenance just means bug fixes." It also covers adapting software to
  new environments (OS/browser updates), performance tuning, and adding
  small enhancements — bug fixing is only one slice of it.
