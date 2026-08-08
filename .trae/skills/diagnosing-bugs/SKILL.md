---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose", "debug this", or reports something broken, throwing, failing, or slow.
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when explicitly justified.

## Phase 1 — Build a feedback loop
**This is the skill.** Everything else is mechanical. Build a tight pass/fail signal for the bug — one that goes red on _this_ bug.

Ways to construct one:
1. Failing test at whatever seam reaches the bug
2. Curl / HTTP script against a running dev server
3. CLI invocation with a fixture input
4. Headless browser script (Playwright/Puppeteer)
5. Replay a captured trace
6. Throwaway harness — minimal subset of the system
7. Property / fuzz loop — run 1000 random inputs
8. Bisection harness — automate `git bisect run`

Tighten the loop: make it faster, sharper, more deterministic.

## Phase 2 — Reproduce + Minimise
Run the loop. Watch it go red. Shrink the repro to the smallest scenario that still goes red.

## Phase 3 — Hypothesise
Generate 3-5 ranked hypotheses before testing any. Each must be falsifiable:
"If X is the cause, then changing Y will make the bug disappear."

## Phase 4 — Instrument
Change one variable at a time. Use debugger/REPL first, targeted logs second. Never "log everything and grep."

## Phase 5 — Fix + Regression Test
Write the regression test before the fix. If no correct seam exists, that itself is the finding — flag it.

## Phase 6 — Cleanup + Post-mortem
- Original repro no longer reproduces
- Regression test passes
- All debug instrumentation removed
- Hypothesis stated in commit message
- Ask: what would have prevented this bug?