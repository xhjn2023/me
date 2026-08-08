---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Breaks work into bite-sized tasks (2-5 minutes each) with exact file paths, code, and verification steps.
---

# Writing Plans

Write comprehensive implementation plans assuming the engineer has zero context. Document everything: which files to touch, code, testing, verification steps. DRY. YAGNI. TDD. Frequent commits.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle. Each step is one action (2-5 minutes):
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Task Structure

Each task must include:
- **Files:** exact paths for create/modify/test
- **Interfaces:** what it consumes and produces (exact signatures)
- **Steps:** checkbox format with actual code, not descriptions

## No Placeholders

Never write: "TBD", "TODO", "implement later", "add appropriate error handling", "write tests for the above" (without actual test code), "similar to Task N" (repeat the code).

## Self-Review

After writing the plan:
1. Spec coverage: can you point to a task for each requirement?
2. Placeholder scan: any red flags?
3. Type consistency: do signatures match across tasks?

## Task Format

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py`

- [ ] **Step 1: Write the failing test**
```code```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/path/test.py -v`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
```code```

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/path/test.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: add specific feature"
```
```