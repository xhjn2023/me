---
name: code-review-and-quality
description: Multi-axis code review with quality gates. Use before merging any change, after completing a feature, or when evaluating code from any source. Covers correctness, readability, architecture, security, and performance.
---

# Code Review and Quality

## Overview

Multi-dimensional code review. Every change gets reviewed before merge — no exceptions. Review covers five axes: correctness, readability, architecture, security, and performance.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect. Don't block because it isn't exactly how you would have written it.

## The Five-Axis Review

### 1. Correctness
- Does it match the spec or task requirements?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled (not just the happy path)?
- Does it pass all tests? Are the tests testing the right things?

### 2. Readability & Simplicity
- Are names descriptive and consistent with project conventions?
- Is control flow straightforward (avoid nested ternaries, deep callbacks)?
- Could this be done in fewer lines? (1000 lines where 100 suffice is a failure)
- Are abstractions earning their complexity? (Don't generalize until the third use case)
- Are there dead code artifacts: no-op variables, backwards-compat shims, or `// removed` comments?

### 3. Architecture
- Is the codebase getting healthier or more complex?
- Are responsibilities clearly separated?
- Are modules deep — small interface, powerful implementation?
- Are new dependencies justified? Each dependency is a liability.

### 4. Security
- Are all external inputs validated at the boundary?
- Are database queries parameterized?
- Is output encoded to prevent XSS?
- Are secrets hardcoded anywhere?

### 5. Performance
- N+1 queries? Missing indexes? Unbounded data loading?
- Blocking the event loop? Missing memoization where it matters?
- Bundle size impact? Unused dependencies?

## Review Speed
- Same-day review (< 24 hours) for all changes
- Review in batches (morning, lunch, end of day)
- Don't review for more than 60 minutes straight — attention decays

## Change Sizing
- Prefer changes under 200 lines
- If a change exceeds 400 lines, split it
- Large changes get a quick pass (architecture, correctness) but not line-by-line review

## Severity Labels
- **Nit**: Preference, not a requirement. Approve even if unfixed.
- **Optional**: Worth considering but not blocking.
- **FYI**: No action needed, just sharing knowledge.
- **Important**: Should be addressed but doesn't block merge.
- **Critical**: Must fix before merge.