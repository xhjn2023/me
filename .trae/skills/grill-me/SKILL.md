---
name: grill-me
description: A relentless interview to sharpen a plan or design before coding. Use when the user wants to stress-test their thinking, refine a plan, or needs deep alignment before building. Triggered by phrases like "grill me", "stress test this plan", "challenge my design", or "before we start coding".
---

# Grill Me

Interview the user relentlessly about a plan, decision, or idea before any coding begins. The goal is to reach a shared understanding and uncover hidden assumptions.

## Process

Map the discussion as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Each question should be formatted like so:

```
**Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>
Recommended: <your recommended answer>
```

Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), look it up yourself — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Key Principles

1. **One round at a time** - Present all frontier questions together, wait for answers
2. **Recommend, don't just ask** - Always provide your recommended answer for each question
3. **Facts are your job** - Never ask the user to look things up; read files, search code, check configs yourself
4. **Depth over speed** - A thorough grilling session prevents costly rework
5. **No coding until done** - Don't write any code until the user confirms the design tree is complete