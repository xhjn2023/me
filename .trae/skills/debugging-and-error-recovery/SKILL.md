---
name: debugging-and-error-recovery
description: Systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected error. Stop-the-line rule: no feature work until the bug is resolved.
---

# Debugging and Error Recovery

## Overview

Systematic debugging with structured triage. When something breaks, stop adding features, preserve evidence, and follow a structured process to find and fix the root cause.

## The Stop-the-Line Rule

```
1. STOP adding features or making changes
2. PRESERVE evidence (error output, logs, repro steps)
3. DIAGNOSE using the triage checklist
4. FIX the root cause
5. GUARD against recurrence
6. RESUME only after verification passes
```

## The Triage Checklist

### Step 1: Reproduce
Make the failure happen reliably. If you can't reproduce it, gather more context, try in a minimal environment, or document conditions.

### Step 2: Localize
Narrow down where the failure occurs:
- Read the error message and stack trace
- Check recent changes (`git log`, `git diff`)
- Bisect: find the exact commit where it broke
- Isolate: reproduce in the smallest possible test case

### Step 3: Reduce
Strip away everything unrelated to the failure. Remove non-essential code, data, and configuration. The goal is the smallest possible reproduction.

### Step 4: Fix
- Write a failing test that reproduces the bug
- Implement the minimal fix
- Verify the test passes
- Confirm no regressions

### Step 5: Guard
- Add the regression test permanently
- Add logging or monitoring if the bug was hard to detect
- Consider: could this class of bug happen elsewhere? Fix preemptively.

## Error Recovery Patterns

### Fail Fast
Validate inputs early. Throw meaningful errors with context. Don't let bad data propagate.

### Graceful Degradation
When a non-critical dependency fails, continue with reduced functionality:
```javascript
try {
  const recommendations = await fetchRecommendations();
} catch (e) {
  console.warn('Recommendations unavailable, showing default content');
  const recommendations = getDefaultRecommendations();
}
```

### Retry with Backoff
For transient failures (network, rate limiting):
```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### Circuit Breaker
After repeated failures, stop trying and fail fast. Prevent cascading failures.

## Common Pitfalls

- **Guessing**: "Let me try changing X and see if it works" — this is thrashing, not debugging
- **Fixing symptoms**: The error message went away, but the root cause remains
- **Multiple changes at once**: Can't isolate what worked. Changes become permanent.
- **No regression test**: The bug will come back. Every bug gets a test.