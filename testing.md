# Software Testing

## The testing pyramid
From the base up: **unit tests** (many, fast, test one function/class in
isolation, usually with dependencies mocked or stubbed), **integration
tests** (fewer, test that multiple units work together correctly, e.g. a
service talking to a real database), **end-to-end / system tests** (few,
slow, exercise the whole system the way a user would). The pyramid shape
is a guideline about proportion, not a rule that higher layers are
optional — a codebase with only end-to-end tests is usually slow to test
and slow to debug when something fails.

## Verification vs. validation
"Verification" asks *are we building the product right?* — does it meet
its specified requirements/design. "Validation" asks *are we building the
right product?* — does it actually meet the user's real need, which the
spec might have gotten wrong. You can pass verification and still fail
validation.

## Black-box vs. white-box testing
Black-box testing checks behavior against inputs/outputs with no
knowledge of internal code structure (e.g. most acceptance testing).
White-box testing is written with knowledge of the internal
implementation, aiming to exercise specific code paths/branches (e.g.
most unit testing with coverage targets). Grey-box testing mixes both.

## Test doubles
"Mock" gets used loosely by students for all of these, but they differ:
- **Stub** — returns canned answers to calls made during the test.
- **Mock** — like a stub, but the test also asserts *that* certain calls
  were made (verifying interactions, not just providing data).
- **Fake** — a working but simplified implementation (e.g. an in-memory
  database standing in for a real one).
- **Spy** — a real object wrapped so the test can observe calls made to
  it.

## Common misconceptions worth correcting
- "100% code coverage means the code is well tested." Coverage measures
  which lines *ran* during tests, not whether the right things were
  *asserted* — you can hit every line with tests that check nothing
  meaningful.
- "Regression testing means testing regressions (bugs)." It means
  re-running existing tests after a change to confirm nothing that used
  to work has broken — "regression" refers to the risk of going
  backwards, not to a specific bug.
- "Unit testing and TDD are the same thing." Unit testing is a *type* of
  test; TDD (Test-Driven Development) is a *process* (write a failing
  test, write minimal code to pass it, refactor) that happens to produce
  unit tests as a side effect.
