---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth — it defines what we're building, why, and how we'll know it's done.

## The Gated Workflow

```
SPECIFY → PLAN → TASKS → IMPLEMENT
   │        │       │         │
   ▼        ▼       ▼         ▼
 Human    Human   Human     Human
 reviews  reviews reviews   reviews
```

### Phase 1: Specify

**Surface assumptions immediately.** Before writing any spec content, list what you're assuming. Don't silently fill in ambiguous requirements.

Write a spec document covering:
1. **Objective** — What are we building and why? Who is the user?
2. **Commands** — Full executable commands (build, test, lint, dev)
3. **Project Structure** — Where source code lives, where tests go
4. **Code Style** — One real code snippet beats three paragraphs
5. **Testing Strategy** — Framework, test locations, coverage expectations
6. **Boundaries** — Always do / Ask first / Never do

### Phase 2: Plan
Identify major components, dependencies, implementation order, risks. The plan should be reviewable: the human should be able to say "yes, that's the right approach."

### Phase 3: Tasks
Break the plan into discrete, implementable tasks. Each task: completable in one session, has explicit acceptance criteria, includes verification step, touches at most ~5 files.

### Phase 4: Implement
Execute tasks one at a time following TDD principles.

## Keeping the Spec Alive
- Update when decisions change
- Update when scope changes
- Commit the spec
- Reference the spec in PRs

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, no spec needed" | A two-line spec is fine. No spec is not. |
| "I'll write the spec after" | That's documentation, not specification. |
| "The spec will slow us down" | 15-minute spec prevents hours of rework. |
| "Requirements will change anyway" | Outdated spec still better than no spec. |

## Red Flags
- Starting to code without any written requirements
- Implementing features not mentioned in any spec or task list
- Making architectural decisions without documenting them
- Skipping the spec because "it's obvious what to build"