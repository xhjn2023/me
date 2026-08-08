---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. Enforces RED-GREEN-REFACTOR cycle: write failing test first, watch it fail, write minimal code, watch it pass, refactor.
---

# Test-Driven Development (TDD)

## Core Principle

Write the test first. Watch it fail. Write minimal code to pass.

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

## Red-Green-Refactor Cycle

### RED - Write Failing Test
Write one minimal test showing what should happen. Clear name, one behavior, real code (no mocks unless unavoidable).

### Verify RED - Watch It Fail
MANDATORY. Run the test. Confirm it fails (not errors) for the expected reason.

### GREEN - Minimal Code
Write simplest code to pass the test. Don't add features, refactor, or "improve" beyond the test.

### Verify GREEN - Watch It Pass
MANDATORY. Run tests. Confirm new test passes, all other tests still pass.

### REFACTOR - Clean Up
After green only: remove duplication, improve names, extract helpers. Keep tests green.

## When to Use

Always: new features, bug fixes, refactoring, behavior changes.

## Common Rationalizations (All Wrong)

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "TDD will slow me down" | TDD faster than debugging. Pragmatic = test-first. |

## Red Flags - STOP and Start Over

- Code before test
- Test passes immediately
- Rationalizing "just this once"
- "Keep as reference" or "adapt existing code"

## Final Rule

Production code → test exists and failed first. Otherwise → not TDD.