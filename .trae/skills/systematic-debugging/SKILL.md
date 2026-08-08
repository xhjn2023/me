---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Follows a 4-phase root cause process: investigate, analyze patterns, form hypothesis, implement fix.
---

# Systematic Debugging

## Core Principle

ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

## The Four Phases

### Phase 1: Root Cause Investigation
1. Read error messages carefully (stack traces, line numbers, error codes)
2. Reproduce consistently (exact steps, every time?)
3. Check recent changes (git diff, new dependencies, config changes)
4. Gather evidence in multi-component systems - trace data flow across boundaries
5. Trace data flow - where does bad value originate? Keep tracing up to source

### Phase 2: Pattern Analysis
1. Find working examples in same codebase
2. Compare against references - read completely, don't skim
3. Identify differences between working and broken
4. Understand dependencies

### Phase 3: Hypothesis and Testing
1. Form single hypothesis: "I think X is root cause because Y"
2. Test minimally - one variable at a time
3. Verify before continuing
4. When stuck: say "I don't understand X", don't pretend

### Phase 4: Implementation
1. Create failing test case first
2. Implement single fix - address root cause, one change at a time
3. Verify fix - test passes, no regressions
4. If 3+ fixes failed: question the architecture, not the symptoms

## Red Flags - STOP

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- 3+ failed fixes = architectural problem