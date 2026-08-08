---
name: code-review
description: Review changes along two axes — Standards (does the code follow coding standards?) and Spec (does it match the spec?). Use when reviewing a branch, PR, or work-in-progress changes.
---

# Code Review

Two-axis review of the diff between HEAD and a fixed point:
- **Standards** — does the code conform to documented coding standards?
- **Spec** — does the code faithfully implement the originating issue/spec?

## Process

### 1. Pin the fixed point
Identify the comparison point (commit SHA, branch, tag, main). Capture: `git diff <fixed-point>...HEAD`.

### 2. Identify the spec source
Look for issue references in commit messages, a spec file, or ask the user.

### 3. Identify the standards sources
Any documented coding standards in the repo (CODING_STANDARDS.md, CONTRIBUTING.md). Plus the smell baseline:

- **Mysterious Name** — name doesn't reveal what it does → rename
- **Duplicated Code** — same logic in multiple places → extract
- **Feature Envy** — method reaches into another object's data → move it
- **Data Clumps** — same fields keep traveling together → bundle into type
- **Primitive Obsession** — primitive standing in for domain concept → give it a type
- **Repeated Switches** — same switch/if-cascade recurs → use polymorphism
- **Shotgun Surgery** — one change forces scattered edits → gather together
- **Divergent Change** — one file edited for unrelated reasons → split
- **Speculative Generality** — abstraction for needs the spec doesn't have → delete
- **Message Chains** — long `a.b().c().d()` navigation → hide behind method
- **Middle Man** — class that mostly delegates → cut it
- **Refused Bequest** — subclass ignores most of what it inherits → use composition

### 4. Review both axes
- Standards: where does the diff violate documented standards or exhibit baseline smells?
- Spec: what's missing, what's scope creep, what looks wrong?

### 5. Aggregate
Present findings under `## Standards` and `## Spec` headings. End with a one-line summary per axis.

## Why two axes
A change can pass one axis and fail the other. Code that follows every standard but implements the wrong thing = Standards pass, Spec fail. Reporting them separately stops one axis from masking the other.