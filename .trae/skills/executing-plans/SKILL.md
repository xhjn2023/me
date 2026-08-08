---
name: executing-plans
description: Use when you have a written implementation plan to execute. Loads plan, reviews critically, executes all tasks with review checkpoints, reports when complete.
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns
3. If concerns: raise them with user before starting
4. If no concerns: create todos for plan items and proceed

### Step 2: Execute Tasks
For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development
After all tasks complete and verified:
- Verify all tests pass
- Present options (merge/PR/keep/discard)
- Clean up workspace

## When to Stop and Ask for Help

STOP executing immediately when:
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps
- You don't understand an instruction
- Verification fails repeatedly

## Key Rules
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Stop when blocked, don't guess
- Never start implementation on main/master without explicit user consent